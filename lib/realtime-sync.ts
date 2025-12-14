import { useEffect, useRef } from 'react';
import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFirestoreDB, isFirebaseConfigured } from './firebase';
import { useAppStore } from './store';
import { Person } from './types';

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
                people.push({ id: doc.id, ...doc.data() } as Person);
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
