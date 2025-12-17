import { useEffect, useRef, useState, useCallback } from 'react';
import { collection, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore';
import { getFirestoreDB, isFirebaseConfigured } from './firebase';
import { useAppStore } from './store';
import { Person, Suggestion, PermissionRequest, IdentityClaimRequest } from './types';

/**
 * Real-time sync hook that works with both Firestore and non-Firestore backends
 * 
 * - If Firestore is configured: Uses real-time listeners (efficient, instant updates)
 * - If not configured: Falls back to polling every 5 seconds (works with any backend/DB)
 */
export const useRealtimeSync = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const fetchFamilyData = useAppStore((state) => state.fetchFamilyData);
  const setFamilyData = useAppStore((state) => (state as any).setFamilyData);
  
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Strategy 1: Try Firestore real-time listeners (if configured)
    if (isFirebaseConfigured()) {
      const db = getFirestoreDB();
      
      if (db) {
        console.log('[Realtime Sync] Using Firestore real-time listeners');
        
        try {
          // Subscribe to Firestore collection changes
          unsubscribeRef.current = onSnapshot(
            collection(db, 'people'),
            (snapshot) => {
              const people: Person[] = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                people.push({ 
                  id: doc.id, 
                  ...data,
                  children: data.children || [] // Normalize children to always be an array
                } as Person);
              });
              
              // Update store directly with real-time data
              setFamilyData(people);
            },
            (error) => {
              console.error('[Realtime Sync] Firestore listener error:', error);
              // Fall back to polling on error
              startPolling();
            }
          );

          return () => {
            if (unsubscribeRef.current) {
              console.log('[Realtime Sync] Cleaning up Firestore listener');
              unsubscribeRef.current();
            }
          };
        } catch (error) {
          console.error('[Realtime Sync] Failed to setup Firestore listener:', error);
          // Fall back to polling
          startPolling();
        }
      }
    }

    // Strategy 2: Fall back to polling (works with any backend)
    function startPolling() {
      console.log('[Realtime Sync] Using polling (every 5 seconds)');
      
      // Initial fetch
      fetchFamilyData();
      
      // Poll every 5 seconds
      pollingIntervalRef.current = setInterval(() => {
        fetchFamilyData();
      }, 5000);
    }

    // If Firestore not configured, use polling
    if (!isFirebaseConfigured()) {
      startPolling();
    }

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        console.log('[Realtime Sync] Cleaning up polling');
        clearInterval(pollingIntervalRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isAuthenticated, fetchFamilyData, setFamilyData]);
};

/**
 * Real-time admin sync hook for suggestions, permission requests, etc.
 * Provides instant updates when new requests come in.
 */
export const useRealtimeAdminSync = (
  collectionName: 'suggestions' | 'permission_requests' | 'identity_claims',
  statusFilter: string = 'pending'
) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const user = useAppStore((state) => state.user);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false); // Track if real-time is active
  const [newItemCount, setNewItemCount] = useState(0);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const previousCountRef = useRef<number>(0);

  // Check if user can view admin data
  const canViewAdminData = user?.role === 'admin' || user?.role === 'co-admin';

  useEffect(() => {
    if (!isAuthenticated || !canViewAdminData) {
      setData([]);
      setIsLoading(false);
      setIsConnected(false);
      return;
    }

    // Try Firestore real-time listeners
    if (isFirebaseConfigured()) {
      const db = getFirestoreDB();
      
      if (db) {
        console.log(`[Admin Realtime] Listening to ${collectionName} (status: ${statusFilter})`);
        setIsLoading(true);
        
        try {
          // Create query with status filter
          const q = query(
            collection(db, collectionName),
            where('status', '==', statusFilter)
          );

          unsubscribeRef.current = onSnapshot(
            q,
            (snapshot) => {
              const items: any[] = [];
              snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
              });
              
              // Sort by created_at descending
              items.sort((a, b) => {
                const timeA = a.created_at?.seconds || 0;
                const timeB = b.created_at?.seconds || 0;
                return timeB - timeA;
              });
              
              // Check for new items (for notification)
              if (previousCountRef.current > 0 && items.length > previousCountRef.current) {
                const newCount = items.length - previousCountRef.current;
                setNewItemCount(prev => prev + newCount);
                
                // Show browser notification if supported
                if (Notification.permission === 'granted') {
                  new Notification(`${newCount} new ${collectionName.replace('_', ' ')}`, {
                    body: 'New items are waiting for your review',
                    icon: '/icon-192x192.png'
                  });
                }
              }
              previousCountRef.current = items.length;
              
              console.log(`[Admin Realtime] ${collectionName} updated:`, items.length, 'items');
              setData(items);
              setIsLoading(false);
              setIsConnected(true); // Mark as connected once we get first snapshot
            },
            (error) => {
              console.error(`[Admin Realtime] Error listening to ${collectionName}:`, error);
              setIsLoading(false);
              setIsConnected(false);
            }
          );

          return () => {
            if (unsubscribeRef.current) {
              console.log(`[Admin Realtime] Cleaning up ${collectionName} listener`);
              unsubscribeRef.current();
              setIsConnected(false);
            }
          };
        } catch (error) {
          console.error(`[Admin Realtime] Failed to setup ${collectionName} listener:`, error);
          setIsLoading(false);
          setIsConnected(false);
        }
      }
    }

    setIsLoading(false);
    setIsConnected(false);
  }, [isAuthenticated, canViewAdminData, collectionName, statusFilter]);

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

/**
 * Hook to get pending counts for admin badge notifications
 */
export const useAdminPendingCounts = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const user = useAppStore((state) => state.user);
  const [counts, setCounts] = useState({
    suggestions: 0,
    permissionRequests: 0,
    identityClaims: 0
  });
  const unsubscribesRef = useRef<Unsubscribe[]>([]);

  const canViewAdminData = user?.role === 'admin' || user?.role === 'co-admin';

  useEffect(() => {
    if (!isAuthenticated || !canViewAdminData || !isFirebaseConfigured()) {
      return;
    }

    const db = getFirestoreDB();
    if (!db) return;

    // Listen to suggestions count
    const suggestionsQuery = query(
      collection(db, 'suggestions'),
      where('status', '==', 'pending')
    );
    unsubscribesRef.current.push(
      onSnapshot(suggestionsQuery, (snapshot) => {
        setCounts(prev => ({ ...prev, suggestions: snapshot.size }));
      })
    );

    // Listen to permission requests count (admin only)
    if (user?.role === 'admin') {
      const permissionsQuery = query(
        collection(db, 'permission_requests'),
        where('status', '==', 'pending')
      );
      unsubscribesRef.current.push(
        onSnapshot(permissionsQuery, (snapshot) => {
          setCounts(prev => ({ ...prev, permissionRequests: snapshot.size }));
        })
      );

      const identityQuery = query(
        collection(db, 'identity_claims'),
        where('status', '==', 'pending')
      );
      unsubscribesRef.current.push(
        onSnapshot(identityQuery, (snapshot) => {
          setCounts(prev => ({ ...prev, identityClaims: snapshot.size }));
        })
      );
    }

    return () => {
      unsubscribesRef.current.forEach(unsub => unsub());
      unsubscribesRef.current = [];
    };
  }, [isAuthenticated, canViewAdminData, user?.role]);

  return counts;
};
