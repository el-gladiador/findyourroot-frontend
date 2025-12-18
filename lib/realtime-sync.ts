/**
 * Real-Time Sync Hooks
 * 
 * This module provides backward-compatible hooks that use the centralized sync system.
 * For new features, consider using the sync system directly: `import { useSync } from '@/lib/sync'`
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAppStore } from './store';
import { 
  useSync, 
  useSyncList,
  createFamilyTreeConfig,
  createSSEConfig,
  SyncManager,
} from './sync';
import { Person } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Real-time sync hook for family tree data
 * Uses the centralized sync system with polling strategy
 */
export const useRealtimeSync = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const token = useAppStore((state) => state.token);
  const fetchFamilyData = useAppStore((state) => state.fetchFamilyData);

  // Use the centralized sync system
  const { isConnected, status } = useSync<Person[]>(
    createFamilyTreeConfig(token ?? undefined),
    {
      enabled: isAuthenticated,
      autoStart: true,
      onData: (event) => {
        // Update store with fetched data
        // The store's fetchFamilyData already handles the API call,
        // so we just need to trigger periodic refreshes
        console.log(`[Realtime Sync] Data received (${event.type})`);
      },
    }
  );

  // Also trigger store's fetchFamilyData for initial load and updates
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('[Realtime Sync] Using polling (every 5 seconds)');
    
    // Initial fetch
    fetchFamilyData();
    
    // Poll every 5 seconds (matching the sync system)
    const interval = setInterval(() => {
      fetchFamilyData();
    }, 5000);

    return () => {
      console.log('[Realtime Sync] Cleaning up polling');
      clearInterval(interval);
    };
  }, [isAuthenticated, fetchFamilyData]);
};

/**
 * SSE-based real-time admin sync hook
 * Uses the centralized sync system with SSE strategy
 */
export const useRealtimeAdminSync = (
  collectionName: 'suggestions' | 'permission_requests' | 'identity_claims',
  statusFilter: string = 'pending'
) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const user = useAppStore((state) => state.user);
  const token = useAppStore((state) => state.token);
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [newItemCount, setNewItemCount] = useState(0);
  const isInitializedRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user can view admin data
  const canViewAdminData = user?.role === 'admin' || user?.role === 'co-admin';

  useEffect(() => {
    if (!isAuthenticated || !canViewAdminData || !token) {
      setData([]);
      setIsLoading(false);
      setIsConnected(false);
      return;
    }

    const connectSSE = () => {
      console.log(`[Admin SSE] Connecting to SSE stream...`);
      setIsLoading(true);

      const sseUrl = `${API_URL}/api/v1/stream/admin?token=${encodeURIComponent(token)}`;
      
      // Timeout fallback - if SSE doesn't connect within 10 seconds, stop loading
      connectionTimeoutRef.current = setTimeout(() => {
        console.log('[Admin SSE] Connection timeout - stopping loading state');
        setIsLoading(false);
      }, 10000);
      
      try {
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('[Admin SSE] Connected');
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
          }
          setIsConnected(true);
          setIsLoading(false);
        };

        // Handle data for our collection
        eventSource.addEventListener(collectionName, (event) => {
          try {
            const payload = JSON.parse(event.data);
            
            // Always ensure loading is false when we receive data
            setIsLoading(false);
            
            if (payload.items !== undefined) {
              // Initial data load
              const items = payload.items || [];
              console.log(`[Admin SSE] ${collectionName} initial data:`, items.length, 'items');
              
              // Sort by created_at descending
              items.sort((a: any, b: any) => {
                const timeA = a.created_at?.seconds || a.created_at || 0;
                const timeB = b.created_at?.seconds || b.created_at || 0;
                return timeB - timeA;
              });
              
              isInitializedRef.current = true;
              setData(items);
            } else if (payload.type && payload.item) {
              // Real-time update
              const { type, item } = payload;
              console.log(`[Admin SSE] ${collectionName} ${type}:`, item.id);
              
              setData(prevData => {
                let newData = [...prevData];
                
                switch (type) {
                  case 'added':
                    if (!newData.find(d => d.id === item.id)) {
                      newData = [item, ...newData];
                      if (isInitializedRef.current) {
                        setNewItemCount(prev => prev + 1);
                        showNotification(collectionName);
                      }
                    }
                    break;
                    
                  case 'modified':
                    newData = newData.map(d => d.id === item.id ? item : d);
                    break;
                    
                  case 'removed':
                    newData = newData.filter(d => d.id !== item.id);
                    break;
                }
                
                // Sort by created_at descending
                newData.sort((a, b) => {
                  const timeA = a.created_at?.seconds || a.created_at || 0;
                  const timeB = b.created_at?.seconds || b.created_at || 0;
                  return timeB - timeA;
                });
                
                return newData;
              });
            }
          } catch (error) {
            console.error(`[Admin SSE] Error parsing ${collectionName} event:`, error);
          }
        });

        eventSource.addEventListener('connected', () => {
          console.log('[Admin SSE] Connection confirmed');
        });

        eventSource.addEventListener('ping', () => {
          // Keepalive received
        });

        eventSource.onerror = () => {
          console.error('[Admin SSE] Connection error');
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
          }
          setIsConnected(false);
          setIsLoading(false);
          eventSource.close();
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[Admin SSE] Reconnecting...');
            connectSSE();
          }, 3000);
        };

      } catch (error) {
        console.error('[Admin SSE] Failed to create EventSource:', error);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        setIsLoading(false);
        setIsConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        console.log(`[Admin SSE] Closing connection`);
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [isAuthenticated, canViewAdminData, token, collectionName, statusFilter]);

  const clearNewItemCount = useCallback(() => {
    setNewItemCount(0);
  }, []);

  // Request notification permission
  useEffect(() => {
    if (canViewAdminData && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [canViewAdminData]);

  return { data, isLoading, isConnected, newItemCount, clearNewItemCount };
};

// Helper to show browser notification
function showNotification(collectionName: string) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    const title = collectionName.replace(/_/g, ' ');
    new Notification(`New ${title}`, {
      body: 'A new item is waiting for your review',
      icon: '/icon-192x192.png'
    });
  }
}

/**
 * Hook to get pending counts for admin badge notifications
 */
export const useAdminPendingCounts = () => {
  const { data: suggestions } = useRealtimeAdminSync('suggestions', 'pending');
  const { data: permissionRequests } = useRealtimeAdminSync('permission_requests', 'pending');
  const { data: identityClaims } = useRealtimeAdminSync('identity_claims', 'pending');

  return {
    suggestions: suggestions.length,
    permissionRequests: permissionRequests.length,
    identityClaims: identityClaims.length
  };
};
