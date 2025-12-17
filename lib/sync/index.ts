/**
 * Centralized Real-Time Sync System
 * 
 * A unified, extensible pipeline for real-time data synchronization.
 * 
 * Features:
 * - Multiple sync strategies: Polling, SSE, WebSocket (future-ready)
 * - Centralized management via SyncManager
 * - Easy-to-use React hooks
 * - Automatic reconnection with backoff
 * - Type-safe with full TypeScript support
 * 
 * @example Basic Usage
 * ```tsx
 * import { useSync, createPollingConfig } from '@/lib/sync';
 * 
 * function MyComponent() {
 *   const { data, isLoading, isConnected } = useSync(
 *     createPollingConfig({
 *       channelId: 'my-data',
 *       endpoint: '/api/v1/my-data',
 *       token: myToken,
 *     })
 *   );
 * 
 *   if (isLoading) return <Loading />;
 *   return <div>{data}</div>;
 * }
 * ```
 * 
 * @example List with real-time updates
 * ```tsx
 * import { useSyncList, createSSEConfig } from '@/lib/sync';
 * 
 * function NotificationsList() {
 *   const { items, newItemCount, clearNewItemCount } = useSyncList(
 *     createSSEConfig({
 *       channelId: 'notifications',
 *       endpoint: '/api/v1/stream/notifications',
 *       token: myToken,
 *     }),
 *     {
 *       getId: (item) => item.id,
 *       sortFn: (a, b) => b.timestamp - a.timestamp,
 *       onItemAdded: (item) => showToast(`New: ${item.title}`),
 *     }
 *   );
 * 
 *   return (
 *     <div>
 *       {newItemCount > 0 && (
 *         <Badge onClick={clearNewItemCount}>{newItemCount} new</Badge>
 *       )}
 *       {items.map(item => <NotificationItem key={item.id} {...item} />)}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example Monitor sync health
 * ```tsx
 * import { useSyncStatus } from '@/lib/sync';
 * 
 * function SyncStatusIndicator() {
 *   const { overallStatus, recentErrors } = useSyncStatus();
 *   
 *   return (
 *     <div>
 *       Status: {overallStatus}
 *       {recentErrors.length > 0 && <ErrorList errors={recentErrors} />}
 *     </div>
 *   );
 * }
 * ```
 */

// Core types
export type {
  SyncStrategy,
  SyncStatus,
  ChangeType,
  SyncConfig,
  SyncEvent,
  SyncError,
  SyncChannelState,
  SyncEventHandler,
  SyncErrorHandler,
  SyncStatusHandler,
  SyncChannel,
} from './types';

// Sync Manager
export { SyncManager } from './manager';

// React Hooks
export {
  useSync,
  useSyncList,
  useSyncStatus,
  type UseSyncOptions,
  type UseSyncResult,
  type UseSyncListOptions,
  type UseSyncListResult,
  type UseSyncStatusResult,
} from './hooks';

// Predefined Channels
export {
  createFamilyTreeConfig,
  createSuggestionsConfig,
  createPermissionRequestsConfig,
  createIdentityClaimsConfig,
  CHANNEL_IDS,
  createPollingConfig,
  createSSEConfig,
  createWebSocketConfig,
  type CreatePollingConfigOptions,
  type CreateSSEConfigOptions,
  type CreateWebSocketConfigOptions,
} from './channels';
