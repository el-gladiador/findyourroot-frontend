/**
 * Centralized Real-Time Sync System - Core Manager
 * 
 * SyncManager is the central hub for all real-time data synchronization.
 * It manages multiple sync channels, each with their own strategy and state.
 */

import {
  SyncConfig,
  SyncStatus,
  SyncEvent,
  SyncError,
  SyncChannelState,
  SyncEventHandler,
  SyncErrorHandler,
  SyncStatusHandler,
  SyncChannel,
  ChangeType,
} from './types';

// ============================================================================
// Event Emitter for Channels
// ============================================================================

class EventEmitter<T> {
  private handlers: Set<(data: T) => void> = new Set();

  emit(data: T): void {
    this.handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('[SyncManager] Handler error:', error);
      }
    });
  }

  subscribe(handler: (data: T) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  clear(): void {
    this.handlers.clear();
  }
}

// ============================================================================
// Base Sync Channel Implementation
// ============================================================================

abstract class BaseSyncChannel<T = unknown> implements SyncChannel<T> {
  config: SyncConfig;
  state: SyncChannelState<T>;

  protected dataEmitter = new EventEmitter<SyncEvent<T>>();
  protected errorEmitter = new EventEmitter<SyncError>();
  protected statusEmitter = new EventEmitter<{ status: SyncStatus; channelId: string }>();
  protected isRunning = false;

  constructor(config: SyncConfig) {
    this.config = {
      autoReconnect: true,
      reconnectDelay: 3000,
      maxReconnectAttempts: 0, // infinite
      pollingInterval: 5000,
      ...config,
    };

    this.state = {
      status: 'disconnected',
      data: null,
      lastSyncAt: null,
      reconnectAttempts: 0,
      lastError: null,
      isInitialized: false,
    };
  }

  abstract start(): void;
  abstract stop(): void;
  abstract refresh(): Promise<void>;

  onData(handler: SyncEventHandler<T>): () => void {
    return this.dataEmitter.subscribe(handler);
  }

  onError(handler: SyncErrorHandler): () => void {
    return this.errorEmitter.subscribe(handler);
  }

  onStatus(handler: SyncStatusHandler): () => void {
    return this.statusEmitter.subscribe(({ status, channelId }) => handler(status, channelId));
  }

  protected setStatus(status: SyncStatus): void {
    this.state.status = status;
    this.statusEmitter.emit({ status, channelId: this.config.channelId });
    console.log(`[Sync:${this.config.channelId}] Status: ${status}`);
  }

  protected emitData(type: ChangeType, data: T, meta?: Record<string, unknown>): void {
    const event: SyncEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
      channelId: this.config.channelId,
      meta,
    };

    // Apply transform if configured
    if (this.config.transform) {
      event.data = this.config.transform(data);
    }

    // Apply filter if configured
    if (this.config.filter && !this.config.filter(event.data)) {
      return;
    }

    this.state.data = event.data;
    this.state.lastSyncAt = event.timestamp;
    this.state.isInitialized = true;

    this.dataEmitter.emit(event);
  }

  protected emitError(code: string, message: string, recoverable: boolean): void {
    const error: SyncError = {
      code,
      message,
      recoverable,
      channelId: this.config.channelId,
      timestamp: Date.now(),
    };

    this.state.lastError = error;
    this.errorEmitter.emit(error);
    console.error(`[Sync:${this.config.channelId}] Error:`, message);
  }

  protected cleanup(): void {
    this.dataEmitter.clear();
    this.errorEmitter.clear();
    this.statusEmitter.clear();
  }
}

// ============================================================================
// Polling Strategy Implementation
// ============================================================================

class PollingSyncChannel<T = unknown> extends BaseSyncChannel<T> {
  private intervalId: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.setStatus('connecting');

    // Initial fetch
    this.fetchData().then(() => {
      if (this.isRunning) {
        this.setStatus('connected');
        // Start polling interval
        this.intervalId = setInterval(() => {
          this.fetchData();
        }, this.config.pollingInterval);
      }
    });
  }

  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.setStatus('disconnected');
  }

  async refresh(): Promise<void> {
    await this.fetchData();
  }

  private async fetchData(): Promise<void> {
    this.abortController = new AbortController();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.config.headers,
      };

      if (this.config.token) {
        headers['Authorization'] = `Bearer ${this.config.token}`;
      }

      const response = await fetch(this.config.endpoint, {
        method: 'GET',
        headers,
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const data = result.data ?? result;

      this.emitData(this.state.isInitialized ? 'modified' : 'initial', data);
      this.state.reconnectAttempts = 0;

    } catch (error) {
      if ((error as Error).name === 'AbortError') return;

      this.emitError(
        'FETCH_ERROR',
        (error as Error).message,
        true
      );
    }
  }
}

// ============================================================================
// SSE (Server-Sent Events) Strategy Implementation
// ============================================================================

class SSESyncChannel<T = unknown> extends BaseSyncChannel<T> {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.connect();
  }

  stop(): void {
    this.isRunning = false;
    this.disconnect();
    this.setStatus('disconnected');
  }

  async refresh(): Promise<void> {
    // For SSE, refresh means reconnect
    this.disconnect();
    this.connect();
  }

  private connect(): void {
    if (!this.isRunning) return;
    this.setStatus('connecting');

    // Build URL with token
    let url = this.config.endpoint;
    if (this.config.token) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${encodeURIComponent(this.config.token)}`;
    }

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log(`[Sync:${this.config.channelId}] SSE connected`);
        this.setStatus('connected');
        this.state.reconnectAttempts = 0;
      };

      // Handle generic message event
      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

      // Handle named events (extract channel name from channelId)
      const eventName = this.config.channelId.split(':').pop() || this.config.channelId;
      this.eventSource.addEventListener(eventName, (event) => {
        this.handleMessage(event as MessageEvent);
      });

      // Handle connection event
      this.eventSource.addEventListener('connected', (event) => {
        console.log(`[Sync:${this.config.channelId}] Connection confirmed`);
      });

      // Handle ping events
      this.eventSource.addEventListener('ping', () => {
        // Keepalive - do nothing
      });

      this.eventSource.onerror = (error) => {
        console.error(`[Sync:${this.config.channelId}] SSE error:`, error);
        this.handleError();
      };

    } catch (error) {
      this.emitError('SSE_CONNECT_ERROR', (error as Error).message, true);
      this.handleError();
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const payload = JSON.parse(event.data);

      // Handle initial data (items array)
      if (payload.items !== undefined) {
        this.emitData('initial', payload.items as T, { collection: payload.collection });
        return;
      }

      // Handle real-time updates
      if (payload.type && payload.item) {
        const changeType = payload.type as ChangeType;
        this.emitData(changeType, payload.item as T, {
          collection: payload.collection,
          itemId: payload.item?.id,
        });
      }
    } catch (error) {
      console.error(`[Sync:${this.config.channelId}] Failed to parse SSE message:`, error);
    }
  }

  private handleError(): void {
    this.disconnect();

    if (!this.isRunning) return;

    // Check reconnect attempts
    if (this.config.maxReconnectAttempts && 
        this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emitError('MAX_RECONNECT_EXCEEDED', 'Maximum reconnect attempts reached', false);
      this.setStatus('error');
      return;
    }

    if (this.config.autoReconnect) {
      this.state.reconnectAttempts++;
      this.setStatus('reconnecting');

      this.reconnectTimeout = setTimeout(() => {
        console.log(`[Sync:${this.config.channelId}] Reconnecting (attempt ${this.state.reconnectAttempts})...`);
        this.connect();
      }, this.config.reconnectDelay);
    } else {
      this.setStatus('error');
    }
  }

  private disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// ============================================================================
// WebSocket Strategy Implementation (Future-ready)
// ============================================================================

class WebSocketSyncChannel<T = unknown> extends BaseSyncChannel<T> {
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.connect();
  }

  stop(): void {
    this.isRunning = false;
    this.disconnect();
    this.setStatus('disconnected');
  }

  async refresh(): Promise<void> {
    // Send refresh request through WebSocket
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'refresh' }));
    }
  }

  private connect(): void {
    if (!this.isRunning) return;
    this.setStatus('connecting');

    // Build WebSocket URL with token
    let url = this.config.endpoint;
    if (this.config.token) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${encodeURIComponent(this.config.token)}`;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log(`[Sync:${this.config.channelId}] WebSocket connected`);
        this.setStatus('connected');
        this.state.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.socket.onerror = (error) => {
        console.error(`[Sync:${this.config.channelId}] WebSocket error:`, error);
      };

      this.socket.onclose = (event) => {
        console.log(`[Sync:${this.config.channelId}] WebSocket closed:`, event.code, event.reason);
        this.handleDisconnect();
      };

    } catch (error) {
      this.emitError('WS_CONNECT_ERROR', (error as Error).message, true);
      this.handleDisconnect();
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const payload = JSON.parse(event.data);
      const changeType = (payload.type || 'modified') as ChangeType;
      this.emitData(changeType, payload.data as T, payload.meta);
    } catch (error) {
      console.error(`[Sync:${this.config.channelId}] Failed to parse WebSocket message:`, error);
    }
  }

  private handleDisconnect(): void {
    this.socket = null;

    if (!this.isRunning) return;

    if (this.config.maxReconnectAttempts && 
        this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emitError('MAX_RECONNECT_EXCEEDED', 'Maximum reconnect attempts reached', false);
      this.setStatus('error');
      return;
    }

    if (this.config.autoReconnect) {
      this.state.reconnectAttempts++;
      this.setStatus('reconnecting');

      this.reconnectTimeout = setTimeout(() => {
        console.log(`[Sync:${this.config.channelId}] Reconnecting (attempt ${this.state.reconnectAttempts})...`);
        this.connect();
      }, this.config.reconnectDelay);
    } else {
      this.setStatus('disconnected');
    }
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// ============================================================================
// Sync Manager - Singleton
// ============================================================================

class SyncManagerImpl {
  private channels: Map<string, SyncChannel<unknown>> = new Map();
  private globalStatusHandlers = new EventEmitter<{ status: SyncStatus; channelId: string }>();
  private globalErrorHandlers = new EventEmitter<SyncError>();

  /**
   * Create and register a new sync channel
   */
  createChannel<T = unknown>(config: SyncConfig): SyncChannel<T> {
    // Stop existing channel if any
    if (this.channels.has(config.channelId)) {
      this.removeChannel(config.channelId);
    }

    let channel: BaseSyncChannel<T>;

    switch (config.strategy) {
      case 'polling':
        channel = new PollingSyncChannel<T>(config);
        break;
      case 'sse':
        channel = new SSESyncChannel<T>(config);
        break;
      case 'websocket':
        channel = new WebSocketSyncChannel<T>(config);
        break;
      default:
        throw new Error(`Unknown sync strategy: ${config.strategy}`);
    }

    // Forward status and error events to global handlers
    channel.onStatus((status, channelId) => {
      this.globalStatusHandlers.emit({ status, channelId });
    });

    channel.onError((error) => {
      this.globalErrorHandlers.emit(error);
    });

    this.channels.set(config.channelId, channel as SyncChannel<unknown>);
    console.log(`[SyncManager] Created channel: ${config.channelId} (${config.strategy})`);

    return channel;
  }

  /**
   * Get an existing channel by ID
   */
  getChannel<T = unknown>(channelId: string): SyncChannel<T> | undefined {
    return this.channels.get(channelId) as SyncChannel<T> | undefined;
  }

  /**
   * Remove and stop a channel
   */
  removeChannel(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.stop();
      this.channels.delete(channelId);
      console.log(`[SyncManager] Removed channel: ${channelId}`);
      return true;
    }
    return false;
  }

  /**
   * Start all channels
   */
  startAll(): void {
    this.channels.forEach((channel, id) => {
      console.log(`[SyncManager] Starting channel: ${id}`);
      channel.start();
    });
  }

  /**
   * Stop all channels
   */
  stopAll(): void {
    this.channels.forEach((channel, id) => {
      console.log(`[SyncManager] Stopping channel: ${id}`);
      channel.stop();
    });
  }

  /**
   * Update token for all channels
   */
  updateToken(token: string | null): void {
    this.channels.forEach((channel) => {
      channel.config.token = token ?? undefined;
    });
  }

  /**
   * Subscribe to status changes from all channels
   */
  onGlobalStatus(handler: SyncStatusHandler): () => void {
    return this.globalStatusHandlers.subscribe(({ status, channelId }) => 
      handler(status, channelId)
    );
  }

  /**
   * Subscribe to errors from all channels
   */
  onGlobalError(handler: SyncErrorHandler): () => void {
    return this.globalErrorHandlers.subscribe(handler);
  }

  /**
   * Get all channel IDs
   */
  getChannelIds(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Get overall sync status
   */
  getOverallStatus(): SyncStatus {
    const statuses = Array.from(this.channels.values()).map(c => c.state.status);
    
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('reconnecting')) return 'reconnecting';
    if (statuses.includes('connecting')) return 'connecting';
    if (statuses.every(s => s === 'connected')) return 'connected';
    return 'disconnected';
  }
}

// Export singleton instance
export const SyncManager = new SyncManagerImpl();
