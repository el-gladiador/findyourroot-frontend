// Offline Sync Queue System
// Handles queuing actions when offline and syncing when back online

export interface QueuedAction {
  id: string;
  type: 'add' | 'edit' | 'delete' | 'suggestion';
  payload: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = 'offline_action_queue';
const MAX_RETRIES = 3;

// Check if online
export const isOnline = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

// Get queued actions from localStorage
export const getQueuedActions = (): QueuedAction[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save queued actions to localStorage
const saveQueuedActions = (actions: QueuedAction[]): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(actions));
};

// Add action to queue
export const queueAction = (type: QueuedAction['type'], payload: any): string => {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const action: QueuedAction = {
    id,
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  };
  
  const queue = getQueuedActions();
  queue.push(action);
  saveQueuedActions(queue);
  
  // Dispatch event for UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offlineQueueUpdate', { detail: queue.length }));
  }
  
  return id;
};

// Remove action from queue
export const removeFromQueue = (id: string): void => {
  const queue = getQueuedActions();
  const filtered = queue.filter(a => a.id !== id);
  saveQueuedActions(filtered);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offlineQueueUpdate', { detail: filtered.length }));
  }
};

// Increment retry count
export const incrementRetry = (id: string): boolean => {
  const queue = getQueuedActions();
  const action = queue.find(a => a.id === id);
  if (!action) return false;
  
  action.retryCount++;
  if (action.retryCount >= MAX_RETRIES) {
    // Remove after max retries
    const filtered = queue.filter(a => a.id !== id);
    saveQueuedActions(filtered);
    return false;
  }
  
  saveQueuedActions(queue);
  return true;
};

// Clear entire queue
export const clearQueue = (): void => {
  saveQueuedActions([]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offlineQueueUpdate', { detail: 0 }));
  }
};

// Sync status
let isSyncing = false;

// Process queue - called when back online
export const processQueue = async (
  handlers: {
    add: (payload: any) => Promise<boolean>;
    edit: (payload: any) => Promise<boolean>;
    delete: (payload: any) => Promise<boolean>;
    suggestion: (payload: any) => Promise<boolean>;
  }
): Promise<{ synced: number; failed: number }> => {
  if (isSyncing) return { synced: 0, failed: 0 };
  if (!isOnline()) return { synced: 0, failed: 0 };
  
  isSyncing = true;
  let synced = 0;
  let failed = 0;
  
  const queue = getQueuedActions();
  
  // Sort by timestamp (oldest first)
  queue.sort((a, b) => a.timestamp - b.timestamp);
  
  for (const action of queue) {
    try {
      const handler = handlers[action.type];
      if (!handler) {
        removeFromQueue(action.id);
        failed++;
        continue;
      }
      
      const success = await handler(action.payload);
      
      if (success) {
        removeFromQueue(action.id);
        synced++;
      } else {
        const shouldRetry = incrementRetry(action.id);
        if (!shouldRetry) {
          failed++;
        }
      }
    } catch (error) {
      console.error(`[OfflineSync] Failed to process action ${action.id}:`, error);
      const shouldRetry = incrementRetry(action.id);
      if (!shouldRetry) {
        failed++;
      }
    }
  }
  
  isSyncing = false;
  
  // Dispatch sync complete event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offlineSyncComplete', { 
      detail: { synced, failed } 
    }));
  }
  
  return { synced, failed };
};

// Setup online/offline listeners
export const setupOfflineSync = (
  handlers: Parameters<typeof processQueue>[0],
  onStatusChange?: (isOnline: boolean) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = async () => {
    console.log('[OfflineSync] Back online, processing queue...');
    onStatusChange?.(true);
    
    // Small delay to ensure connection is stable
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (isOnline()) {
      const result = await processQueue(handlers);
      console.log(`[OfflineSync] Synced ${result.synced} actions, ${result.failed} failed`);
    }
  };
  
  const handleOffline = () => {
    console.log('[OfflineSync] Gone offline');
    onStatusChange?.(false);
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Also try to sync on visibility change (user returns to tab)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isOnline()) {
      processQueue(handlers);
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Initial sync if online and queue has items
  if (isOnline() && getQueuedActions().length > 0) {
    setTimeout(() => processQueue(handlers), 2000);
  }
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Show notification
export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  
  // Check if notifications are enabled in settings
  const notificationsEnabled = localStorage.getItem('notifications') !== 'false';
  if (!notificationsEnabled) return;
  
  try {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  } catch (error) {
    // Fallback for browsers that don't support Notification constructor
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options,
      });
    }
  }
};

// Get notification permission status
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};
