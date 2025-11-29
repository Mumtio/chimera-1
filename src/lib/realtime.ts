/**
 * Real-time Update Service
 * Provides live updates for collaborative features using polling + event system
 */

type EventType = 
  | 'workspace:updated'
  | 'workspace:deleted'
  | 'conversation:created'
  | 'conversation:updated'
  | 'conversation:deleted'
  | 'message:created'
  | 'message:updated'
  | 'message:deleted'
  | 'memory:created'
  | 'memory:updated'
  | 'memory:deleted'
  | 'team:updated'
  | 'invitation:received';

interface RealtimeEvent {
  type: EventType;
  payload: any;
  timestamp: number;
  workspaceId?: string;
}

type EventHandler = (event: RealtimeEvent) => void;

class RealtimeService {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();
  private pollingIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private isConnected: boolean = false;

  // Polling intervals in ms
  private readonly FAST_POLL_INTERVAL = 3000;    // 3s for active workspace
  private readonly SLOW_POLL_INTERVAL = 15000;   // 15s for background data
  private readonly INVITATION_POLL_INTERVAL = 10000; // 10s for invitations

  /**
   * Initialize the realtime service with auth token
   */
  connect(_token: string) {
    this.isConnected = true;
    console.log('[Realtime] Connected');
  }

  /**
   * Disconnect and cleanup all polling
   */
  disconnect() {
    this.isConnected = false;
    this.stopAllPolling();
    console.log('[Realtime] Disconnected');
  }

  /**
   * Subscribe to specific event types
   */
  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);
    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  /**
   * Emit an event (for local updates that should trigger handlers)
   */
  emit(event: RealtimeEvent) {
    // Notify specific handlers
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (e) {
          console.error('[Realtime] Handler error:', e);
        }
      });
    }

    // Notify global handlers
    this.globalHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (e) {
        console.error('[Realtime] Global handler error:', e);
      }
    });
  }

  /**
   * Start polling for workspace updates
   */
  startWorkspacePolling(workspaceId: string, fetchFn: () => Promise<void>) {
    const key = `workspace:${workspaceId}`;
    this.stopPolling(key);

    // Initial fetch
    fetchFn().catch(console.error);

    const interval = setInterval(() => {
      if (this.isConnected) {
        fetchFn().catch(console.error);
      }
    }, this.FAST_POLL_INTERVAL);

    this.pollingIntervals.set(key, interval);
    console.log(`[Realtime] Started polling for workspace ${workspaceId}`);
  }

  /**
   * Start polling for conversations in a workspace
   */
  startConversationPolling(workspaceId: string, fetchFn: () => Promise<void>) {
    const key = `conversations:${workspaceId}`;
    this.stopPolling(key);

    const interval = setInterval(() => {
      if (this.isConnected) {
        fetchFn().catch(console.error);
      }
    }, this.FAST_POLL_INTERVAL);

    this.pollingIntervals.set(key, interval);
  }

  /**
   * Start polling for memories in a workspace
   */
  startMemoryPolling(workspaceId: string, fetchFn: () => Promise<void>) {
    const key = `memories:${workspaceId}`;
    this.stopPolling(key);

    const interval = setInterval(() => {
      if (this.isConnected) {
        fetchFn().catch(console.error);
      }
    }, this.SLOW_POLL_INTERVAL);

    this.pollingIntervals.set(key, interval);
  }

  /**
   * Start polling for team updates
   */
  startTeamPolling(workspaceId: string, fetchFn: () => Promise<void>) {
    const key = `team:${workspaceId}`;
    this.stopPolling(key);

    const interval = setInterval(() => {
      if (this.isConnected) {
        fetchFn().catch(console.error);
      }
    }, this.SLOW_POLL_INTERVAL);

    this.pollingIntervals.set(key, interval);
  }

  /**
   * Start polling for invitations
   */
  startInvitationPolling(fetchFn: () => Promise<void>) {
    const key = 'invitations';
    this.stopPolling(key);

    const interval = setInterval(() => {
      if (this.isConnected) {
        fetchFn().catch(console.error);
      }
    }, this.INVITATION_POLL_INTERVAL);

    this.pollingIntervals.set(key, interval);
  }

  /**
   * Start polling for active conversation messages
   */
  startMessagePolling(conversationId: string, fetchFn: () => Promise<void>) {
    const key = `messages:${conversationId}`;
    this.stopPolling(key);

    // Fast polling for active chat
    const interval = setInterval(() => {
      if (this.isConnected) {
        fetchFn().catch(console.error);
      }
    }, 2000); // 2s for active chat

    this.pollingIntervals.set(key, interval);
  }

  /**
   * Stop polling for a specific key
   */
  stopPolling(key: string) {
    const interval = this.pollingIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(key);
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling() {
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
    console.log('[Realtime] Stopped all polling');
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// React hook for using realtime events
import { useEffect } from 'react';

export function useRealtimeEvent(eventType: EventType, handler: EventHandler) {
  useEffect(() => {
    const unsubscribe = realtimeService.on(eventType, handler);
    return unsubscribe;
  }, [eventType, handler]);
}

export function useRealtimePolling(
  key: string,
  fetchFn: () => Promise<void>,
  interval: number = 5000,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !realtimeService.connected) return;

    // Initial fetch
    fetchFn().catch(console.error);

    const pollInterval = setInterval(() => {
      if (realtimeService.connected) {
        fetchFn().catch(console.error);
      }
    }, interval);

    return () => clearInterval(pollInterval);
  }, [key, fetchFn, interval, enabled]);
}
