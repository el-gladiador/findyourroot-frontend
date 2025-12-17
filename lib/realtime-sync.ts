import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from './store';
import { Person } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Real-time sync hook using polling for family data
 * Polls the backend every 5 seconds for updates
 */
export const useRealtimeSync = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const fetchFamilyData = useAppStore((state) => state.fetchFamilyData);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    console.log('[Realtime Sync] Using polling (every 5 seconds)');
    
    // Initial fetch
    fetchFamilyData();
    
    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchFamilyData();
    }, 5000);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        console.log('[Realtime Sync] Cleaning up polling');
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isAuthenticated, fetchFamilyData]);
};

/**
 * SSE (Server-Sent Events) based real-time admin sync
 * Connects to backend SSE endpoint for instant updates
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
  const eventSourceRef = useRef<EventSource | null>(null);
  const previousCountRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      // Create EventSource with auth token in URL (SSE doesn't support headers)
      const sseUrl = `${API_URL}/api/v1/stream/admin?token=${encodeURIComponent(token)}`;
      
      try {
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('[Admin SSE] Connected');
          setIsConnected(true);
          setIsLoading(false);
        };

        // Handle initial data for our collection
        eventSource.addEventListener(collectionName, (event) => {
          try {
            const payload = JSON.parse(event.data);
            
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
              
              previousCountRef.current = items.length;
              setData(items);
            } else if (payload.type && payload.item) {
              // Real-time update
              const { type, item } = payload;
              console.log(`[Admin SSE] ${collectionName} ${type}:`, item.id);
              
              setData(prevData => {
                let newData = [...prevData];
                
                switch (type) {
                  case 'added':
                    // Check if item already exists
                    if (!newData.find(d => d.id === item.id)) {
                      newData = [item, ...newData];
                      // Show notification for new items
                      if (previousCountRef.current > 0) {
                        setNewItemCount(prev => prev + 1);
                        showNotification(collectionName);
                      }
                      previousCountRef.current = newData.length;
                    }
                    break;
                    
                  case 'modified':
                    newData = newData.map(d => d.id === item.id ? item : d);
                    break;
                    
                  case 'removed':
                    newData = newData.filter(d => d.id !== item.id);
                    previousCountRef.current = newData.length;
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

        // Handle connection message
        eventSource.addEventListener('connected', (event) => {
          console.log('[Admin SSE] Connection confirmed:', event.data);
        });

        // Handle ping (keepalive)
        eventSource.addEventListener('ping', () => {
          // Keepalive received
        });

        eventSource.onerror = (error) => {
          console.error('[Admin SSE] Connection error:', error);
          setIsConnected(false);
          eventSource.close();
          
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[Admin SSE] Reconnecting...');
            connectSSE();
          }, 3000);
        };

      } catch (error) {
        console.error('[Admin SSE] Failed to create EventSource:', error);
        setIsLoading(false);
        setIsConnected(false);
      }
    };

    connectSSE();

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        console.log(`[Admin SSE] Closing connection`);
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, canViewAdminData, token, collectionName, statusFilter]);

  // Function to clear new item notification count
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
 * Uses the same SSE connection
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
