/**
 * Real-time Hooks
 * React hooks for integrating real-time updates with stores
 */

import { useEffect, useRef } from 'react';
import { realtimeService } from '../lib/realtime';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useChatStore } from '../stores/chatStore';
import { useMemoryStore } from '../stores/memoryStore';
import { useInvitationStore } from '../stores/invitationStore';
import { useAuthStore } from '../stores/authStore';

/**
 * Initialize realtime connection when user is authenticated
 * Also tracks user changes to prevent data leakage between users
 */
export function useRealtimeConnection(isAuthenticated: boolean, token: string | null) {
  const previousUserIdRef = useRef<string | null>(null);
  const user = useAuthStore(state => state.user);
  const currentUserId = user?.id || null;

  useEffect(() => {
    // Detect user change - if user ID changed, disconnect and clear data
    if (previousUserIdRef.current !== null && previousUserIdRef.current !== currentUserId) {
      console.log('[Realtime] User changed, disconnecting and clearing data');
      realtimeService.disconnect();
      
      // Clear all stores when user changes
      useWorkspaceStore.setState({
        workspaces: [],
        activeWorkspaceId: null,
        previousWorkspaceId: null,
        isTransitioning: false,
        transitionProgress: 0,
        isLoading: false,
      });
      
      useChatStore.setState({
        conversations: [],
        activeConversationId: null,
        autoStore: true,
        isLoading: false,
      });
      
      useMemoryStore.setState({
        memories: [],
        searchQuery: '',
        sortBy: 'recent',
        selectedMemoryId: null,
        isLoading: false,
      });
      
      useInvitationStore.setState({
        invitations: [],
        isLoading: false,
      });
    }
    
    previousUserIdRef.current = currentUserId;

    if (isAuthenticated && token && currentUserId) {
      realtimeService.connect(token);
    } else {
      realtimeService.disconnect();
    }

    return () => {
      realtimeService.disconnect();
    };
  }, [isAuthenticated, token, currentUserId]);
}

/**
 * Poll for workspace list updates
 */
export function useWorkspacePolling(enabled: boolean = true) {
  const loadWorkspaces = useWorkspaceStore(state => state.loadWorkspaces);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !realtimeService.connected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Poll every 10 seconds for workspace list
    intervalRef.current = setInterval(() => {
      loadWorkspaces().catch(console.error);
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, loadWorkspaces]);
}

/**
 * Poll for conversation updates in active workspace
 */
export function useConversationPolling(workspaceId: string | null, enabled: boolean = true) {
  const loadConversations = useChatStore(state => state.loadConversations);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !workspaceId || !realtimeService.connected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Poll every 5 seconds for conversations
    intervalRef.current = setInterval(() => {
      loadConversations(workspaceId).catch(console.error);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workspaceId, enabled, loadConversations]);
}

/**
 * Poll for active conversation messages
 */
export function useMessagePolling(conversationId: string | null, enabled: boolean = true) {
  const loadConversationMessages = useChatStore(state => state.loadConversationMessages);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !conversationId || !realtimeService.connected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Poll every 5 seconds for messages in active conversation
    // The store will skip updates if no changes detected to prevent flickering
    intervalRef.current = setInterval(() => {
      loadConversationMessages(conversationId).catch(console.error);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [conversationId, enabled, loadConversationMessages]);
}

/**
 * Poll for memory updates in active workspace
 */
export function useMemoryPolling(workspaceId: string | null, enabled: boolean = true) {
  const loadMemories = useMemoryStore(state => state.loadMemories);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !workspaceId || !realtimeService.connected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Poll every 10 seconds for memories
    intervalRef.current = setInterval(() => {
      loadMemories(workspaceId).catch(console.error);
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workspaceId, enabled, loadMemories]);
}

/**
 * Poll for invitation updates
 */
export function useInvitationPolling(enabled: boolean = true) {
  const loadInvitations = useInvitationStore(state => state.loadInvitations);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !realtimeService.connected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Poll every 15 seconds for invitations
    intervalRef.current = setInterval(() => {
      loadInvitations().catch(console.error);
    }, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, loadInvitations]);
}

/**
 * Combined hook for all realtime updates based on current context
 */
export function useRealtimeUpdates(options: {
  workspaceId: string | null;
  conversationId: string | null;
  isAuthenticated: boolean;
  token: string | null;
}) {
  const { workspaceId, conversationId, isAuthenticated, token } = options;

  // Initialize connection
  useRealtimeConnection(isAuthenticated, token);

  // Poll for various data
  useWorkspacePolling(isAuthenticated);
  useConversationPolling(workspaceId, isAuthenticated);
  useMessagePolling(conversationId, isAuthenticated);
  useMemoryPolling(workspaceId, isAuthenticated);
  useInvitationPolling(isAuthenticated);
}
