/**
 * Centralized Real-Time Sync System - React Hooks
 * 
 * Custom hooks for easy integration with React components.
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { SyncManager } from './manager';
import {
  SyncConfig,
  SyncStatus,
  SyncEvent,
  SyncError,
  SyncChannel,
  ChangeType,
} from './types';

// ============================================================================
// Hook: useSync - Generic sync hook for any data
// ============================================================================

export interface UseSyncOptions<T> {
  /** Whether to start syncing immediately (default: true) */
  autoStart?: boolean;
  
  /** Initial data before sync starts */
  initialData?: T;
  
  /** Callback when data changes */
  onData?: (event: SyncEvent<T>) => void;
  
  /** Callback on errors */
  onError?: (error: SyncError) => void;
  
  /** Callback on status changes */
  onStatus?: (status: SyncStatus) => void;
  
  /** Whether this hook is enabled (useful for conditional syncing) */
  enabled?: boolean;
}

export interface UseSyncResult<T> {
  /** Current synced data */
  data: T | null;
  
  /** Whether initial data is loading */
  isLoading: boolean;
  
  /** Current sync status */
  status: SyncStatus;
  
  /** Whether connected and syncing */
  isConnected: boolean;
  
  /** Last error if any */
  error: SyncError | null;
  
  /** Last sync timestamp */
  lastSyncAt: number | null;
  
  /** Manually refresh data */
  refresh: () => Promise<void>;
  
  /** Start syncing */
  start: () => void;
  
  /** Stop syncing */
  stop: () => void;
}

export function useSync<T = unknown>(
  config: SyncConfig,
  options: UseSyncOptions<T> = {}
): UseSyncResult<T> {
  const {
    autoStart = true,
    initialData,
    onData,
    onError,
    onStatus,
    enabled = true,
  } = options;

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<SyncStatus>('disconnected');
  const [error, setError] = useState<SyncError | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  const channelRef = useRef<SyncChannel<T> | null>(null);
  const configRef = useRef(config);

  // Update config ref
  configRef.current = config;

  // Create or update channel
  useEffect(() => {
    if (!enabled) {
      if (channelRef.current) {
        SyncManager.removeChannel(config.channelId);
        channelRef.current = null;
      }
      return;
    }

    // Create channel
    const channel = SyncManager.createChannel<T>(config);
    channelRef.current = channel;

    // Subscribe to events
    const unsubData = channel.onData((event) => {
      setData(event.data);
      setLastSyncAt(event.timestamp);
      setIsLoading(false);
      setError(null);
      onData?.(event);
    });

    const unsubError = channel.onError((err) => {
      setError(err);
      onError?.(err);
    });

    const unsubStatus = channel.onStatus((newStatus) => {
      setStatus(newStatus);
      onStatus?.(newStatus);
    });

    // Auto-start if configured
    if (autoStart) {
      channel.start();
    }

    // Cleanup
    return () => {
      unsubData();
      unsubError();
      unsubStatus();
      SyncManager.removeChannel(config.channelId);
      channelRef.current = null;
    };
  }, [config.channelId, config.endpoint, config.strategy, config.token, enabled, autoStart]);

  const refresh = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.refresh();
    }
  }, []);

  const start = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.start();
    }
  }, []);

  const stop = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.stop();
    }
  }, []);

  return {
    data,
    isLoading,
    status,
    isConnected: status === 'connected',
    error,
    lastSyncAt,
    refresh,
    start,
    stop,
  };
}

// ============================================================================
// Hook: useSyncList - For syncing list data with item-level updates
// ============================================================================

export interface UseSyncListOptions<T> extends Omit<UseSyncOptions<T[]>, 'onData'> {
  /** Get unique ID from item */
  getId: (item: T) => string;
  
  /** Callback when item is added */
  onItemAdded?: (item: T) => void;
  
  /** Callback when item is modified */
  onItemModified?: (item: T) => void;
  
  /** Callback when item is removed */
  onItemRemoved?: (item: T) => void;
  
  /** Sort function for the list */
  sortFn?: (a: T, b: T) => number;
}

export interface UseSyncListResult<T> extends Omit<UseSyncResult<T[]>, 'data'> {
  /** Current list of items */
  items: T[];
  
  /** Count of new items since last view */
  newItemCount: number;
  
  /** Clear new item count */
  clearNewItemCount: () => void;
}

export function useSyncList<T>(
  config: SyncConfig,
  options: UseSyncListOptions<T>
): UseSyncListResult<T> {
  const {
    getId,
    onItemAdded,
    onItemModified,
    onItemRemoved,
    sortFn,
    initialData = [],
    ...baseOptions
  } = options;

  const [items, setItems] = useState<T[]>(initialData);
  const [newItemCount, setNewItemCount] = useState(0);
  const isInitializedRef = useRef(false);

  const handleData = useCallback((event: SyncEvent<T | T[]>) => {
    const { type, data } = event;

    setItems(prevItems => {
      let newItems = [...prevItems];

      switch (type) {
        case 'initial':
          // Initial load - replace all items
          newItems = Array.isArray(data) ? data : [data];
          isInitializedRef.current = true;
          break;

        case 'added':
          // Add new item if not exists
          if (!Array.isArray(data)) {
            const item = data as T;
            if (!newItems.find(i => getId(i) === getId(item))) {
              newItems = [item, ...newItems];
              if (isInitializedRef.current) {
                setNewItemCount(c => c + 1);
                onItemAdded?.(item);
              }
            }
          }
          break;

        case 'modified':
          // Update existing item
          if (!Array.isArray(data)) {
            const item = data as T;
            newItems = newItems.map(i => getId(i) === getId(item) ? item : i);
            onItemModified?.(item);
          } else {
            // Full list update
            newItems = data;
          }
          break;

        case 'removed':
          // Remove item
          if (!Array.isArray(data)) {
            const item = data as T;
            newItems = newItems.filter(i => getId(i) !== getId(item));
            onItemRemoved?.(item);
          }
          break;
      }

      // Apply sort if provided
      if (sortFn) {
        newItems.sort(sortFn);
      }

      return newItems;
    });
  }, [getId, onItemAdded, onItemModified, onItemRemoved, sortFn]);

  const syncResult = useSync<T | T[]>(config, {
    ...baseOptions,
    initialData: initialData,
    onData: handleData,
  });

  const clearNewItemCount = useCallback(() => {
    setNewItemCount(0);
  }, []);

  return {
    items,
    newItemCount,
    clearNewItemCount,
    isLoading: syncResult.isLoading,
    status: syncResult.status,
    isConnected: syncResult.isConnected,
    error: syncResult.error,
    lastSyncAt: syncResult.lastSyncAt,
    refresh: syncResult.refresh,
    start: syncResult.start,
    stop: syncResult.stop,
  };
}

// ============================================================================
// Hook: useSyncStatus - For monitoring overall sync health
// ============================================================================

export interface UseSyncStatusResult {
  /** Overall sync status */
  overallStatus: SyncStatus;
  
  /** Status of each channel */
  channelStatuses: Record<string, SyncStatus>;
  
  /** Recent errors */
  recentErrors: SyncError[];
  
  /** Clear recent errors */
  clearErrors: () => void;
}

export function useSyncStatus(): UseSyncStatusResult {
  const [channelStatuses, setChannelStatuses] = useState<Record<string, SyncStatus>>({});
  const [recentErrors, setRecentErrors] = useState<SyncError[]>([]);

  useEffect(() => {
    const unsubStatus = SyncManager.onGlobalStatus((status, channelId) => {
      setChannelStatuses(prev => ({ ...prev, [channelId]: status }));
    });

    const unsubError = SyncManager.onGlobalError((error) => {
      setRecentErrors(prev => [error, ...prev].slice(0, 10)); // Keep last 10 errors
    });

    return () => {
      unsubStatus();
      unsubError();
    };
  }, []);

  const clearErrors = useCallback(() => {
    setRecentErrors([]);
  }, []);

  const overallStatus = useMemo(() => {
    const statuses = Object.values(channelStatuses);
    if (statuses.length === 0) return 'disconnected';
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('reconnecting')) return 'reconnecting';
    if (statuses.includes('connecting')) return 'connecting';
    if (statuses.every(s => s === 'connected')) return 'connected';
    return 'disconnected';
  }, [channelStatuses]);

  return {
    overallStatus,
    channelStatuses,
    recentErrors,
    clearErrors,
  };
}
