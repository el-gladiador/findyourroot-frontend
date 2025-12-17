/**
 * Centralized Real-Time Sync System - Type Definitions
 * 
 * This module defines the core types for the sync pipeline system.
 */

// ============================================================================
// Sync Strategy Types
// ============================================================================

export type SyncStrategy = 'polling' | 'sse' | 'websocket';

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export type ChangeType = 'added' | 'modified' | 'removed' | 'initial';

// ============================================================================
// Sync Configuration
// ============================================================================

export interface SyncConfig {
  /** Unique identifier for this sync channel */
  channelId: string;
  
  /** Strategy to use for syncing */
  strategy: SyncStrategy;
  
  /** API endpoint for fetching data (polling) or connecting (SSE/WebSocket) */
  endpoint: string;
  
  /** Polling interval in milliseconds (only for polling strategy) */
  pollingInterval?: number;
  
  /** Whether to auto-reconnect on connection loss */
  autoReconnect?: boolean;
  
  /** Delay before reconnecting in milliseconds */
  reconnectDelay?: number;
  
  /** Maximum reconnect attempts (0 = infinite) */
  maxReconnectAttempts?: number;
  
  /** Authentication token */
  token?: string;
  
  /** Custom headers for requests */
  headers?: Record<string, string>;
  
  /** Transform function for incoming data */
  transform?: <T>(data: unknown) => T;
  
  /** Filter function for incoming data */
  filter?: <T>(data: T) => boolean;
}

// ============================================================================
// Sync Events
// ============================================================================

export interface SyncEvent<T = unknown> {
  /** Type of change */
  type: ChangeType;
  
  /** The data payload */
  data: T;
  
  /** Timestamp of the event */
  timestamp: number;
  
  /** Channel that emitted this event */
  channelId: string;
  
  /** Optional metadata */
  meta?: Record<string, unknown>;
}

export interface SyncError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Whether the error is recoverable */
  recoverable: boolean;
  
  /** Channel that had the error */
  channelId: string;
  
  /** Timestamp of the error */
  timestamp: number;
}

// ============================================================================
// Sync Channel State
// ============================================================================

export interface SyncChannelState<T = unknown> {
  /** Current status of the channel */
  status: SyncStatus;
  
  /** Current data */
  data: T | null;
  
  /** Last sync timestamp */
  lastSyncAt: number | null;
  
  /** Number of reconnect attempts */
  reconnectAttempts: number;
  
  /** Last error if any */
  lastError: SyncError | null;
  
  /** Whether initial data has been loaded */
  isInitialized: boolean;
}

// ============================================================================
// Event Handlers
// ============================================================================

export type SyncEventHandler<T = unknown> = (event: SyncEvent<T>) => void;
export type SyncErrorHandler = (error: SyncError) => void;
export type SyncStatusHandler = (status: SyncStatus, channelId: string) => void;

// ============================================================================
// Sync Manager Types
// ============================================================================

export interface SyncChannel<T = unknown> {
  /** Channel configuration */
  config: SyncConfig;
  
  /** Current state */
  state: SyncChannelState<T>;
  
  /** Start syncing */
  start: () => void;
  
  /** Stop syncing */
  stop: () => void;
  
  /** Force refresh data */
  refresh: () => Promise<void>;
  
  /** Subscribe to data changes */
  onData: (handler: SyncEventHandler<T>) => () => void;
  
  /** Subscribe to errors */
  onError: (handler: SyncErrorHandler) => () => void;
  
  /** Subscribe to status changes */
  onStatus: (handler: SyncStatusHandler) => () => void;
}

// ============================================================================
// Predefined Channel Configs
// ============================================================================

export interface PredefinedChannels {
  familyTree: SyncConfig;
  suggestions: SyncConfig;
  permissionRequests: SyncConfig;
  identityClaims: SyncConfig;
}
