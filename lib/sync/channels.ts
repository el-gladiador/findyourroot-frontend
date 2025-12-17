/**
 * Centralized Real-Time Sync System - Predefined Channels
 * 
 * Pre-configured sync channels for common use cases in the app.
 */

import { SyncConfig } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ============================================================================
// Channel Factory Functions
// ============================================================================

/**
 * Create config for family tree data sync (polling)
 */
export const createFamilyTreeConfig = (token?: string): SyncConfig => ({
  channelId: 'family-tree',
  strategy: 'polling',
  endpoint: `${API_URL}/api/v1/tree`,
  pollingInterval: 5000,
  autoReconnect: true,
  token,
});

/**
 * Create config for suggestions sync (SSE)
 */
export const createSuggestionsConfig = (token?: string): SyncConfig => ({
  channelId: 'admin:suggestions',
  strategy: 'sse',
  endpoint: `${API_URL}/api/v1/stream/admin`,
  autoReconnect: true,
  reconnectDelay: 3000,
  token,
});

/**
 * Create config for permission requests sync (SSE)
 */
export const createPermissionRequestsConfig = (token?: string): SyncConfig => ({
  channelId: 'admin:permission_requests',
  strategy: 'sse',
  endpoint: `${API_URL}/api/v1/stream/admin`,
  autoReconnect: true,
  reconnectDelay: 3000,
  token,
});

/**
 * Create config for identity claims sync (SSE)
 */
export const createIdentityClaimsConfig = (token?: string): SyncConfig => ({
  channelId: 'admin:identity_claims',
  strategy: 'sse',
  endpoint: `${API_URL}/api/v1/stream/admin`,
  autoReconnect: true,
  reconnectDelay: 3000,
  token,
});

// ============================================================================
// Channel IDs (for reference)
// ============================================================================

export const CHANNEL_IDS = {
  FAMILY_TREE: 'family-tree',
  SUGGESTIONS: 'admin:suggestions',
  PERMISSION_REQUESTS: 'admin:permission_requests',
  IDENTITY_CLAIMS: 'admin:identity_claims',
} as const;

// ============================================================================
// Utility: Create custom polling config
// ============================================================================

export interface CreatePollingConfigOptions {
  channelId: string;
  endpoint: string;
  token?: string;
  pollingInterval?: number;
}

export const createPollingConfig = (options: CreatePollingConfigOptions): SyncConfig => ({
  channelId: options.channelId,
  strategy: 'polling',
  endpoint: options.endpoint.startsWith('http') ? options.endpoint : `${API_URL}${options.endpoint}`,
  pollingInterval: options.pollingInterval ?? 5000,
  autoReconnect: true,
  token: options.token,
});

// ============================================================================
// Utility: Create custom SSE config
// ============================================================================

export interface CreateSSEConfigOptions {
  channelId: string;
  endpoint: string;
  token?: string;
  reconnectDelay?: number;
}

export const createSSEConfig = (options: CreateSSEConfigOptions): SyncConfig => ({
  channelId: options.channelId,
  strategy: 'sse',
  endpoint: options.endpoint.startsWith('http') ? options.endpoint : `${API_URL}${options.endpoint}`,
  autoReconnect: true,
  reconnectDelay: options.reconnectDelay ?? 3000,
  token: options.token,
});

// ============================================================================
// Utility: Create custom WebSocket config (future-ready)
// ============================================================================

export interface CreateWebSocketConfigOptions {
  channelId: string;
  endpoint: string;
  token?: string;
  reconnectDelay?: number;
}

export const createWebSocketConfig = (options: CreateWebSocketConfigOptions): SyncConfig => {
  // Convert http(s) to ws(s)
  let wsEndpoint = options.endpoint;
  if (!wsEndpoint.startsWith('ws')) {
    wsEndpoint = wsEndpoint.startsWith('http') 
      ? options.endpoint 
      : `${API_URL}${options.endpoint}`;
    wsEndpoint = wsEndpoint.replace(/^http/, 'ws');
  }

  return {
    channelId: options.channelId,
    strategy: 'websocket',
    endpoint: wsEndpoint,
    autoReconnect: true,
    reconnectDelay: options.reconnectDelay ?? 3000,
    token: options.token,
  };
};
