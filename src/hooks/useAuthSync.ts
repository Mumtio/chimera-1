/**
 * Cross-Tab Authentication Synchronization
 * 
 * This hook detects when the auth token changes in another tab (e.g., when
 * another user logs in) and forces a logout/redirect to prevent data leakage.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useChatStore } from '../stores/chatStore';
import { useMemoryStore } from '../stores/memoryStore';
import { useInvitationStore } from '../stores/invitationStore';
import { useIntegrationStore } from '../stores/integrationStore';
import { realtimeService } from '../lib/realtime';

/**
 * Clears all application stores to prevent data leakage
 */
function clearAllStores() {
  // Stop all polling
  realtimeService.disconnect();

  // Clear auth store
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Clear workspace store
  useWorkspaceStore.setState({
    workspaces: [],
    activeWorkspaceId: null,
    previousWorkspaceId: null,
    isTransitioning: false,
    transitionProgress: 0,
    isLoading: false,
  });

  // Clear chat store
  useChatStore.setState({
    conversations: [],
    activeConversationId: null,
    autoStore: true,
    isLoading: false,
  });

  // Clear memory store
  useMemoryStore.setState({
    memories: [],
    searchQuery: '',
    sortBy: 'recent',
    selectedMemoryId: null,
    isLoading: false,
  });

  // Clear invitation store
  useInvitationStore.setState({
    invitations: [],
    isLoading: false,
  });

  // Clear integration store
  useIntegrationStore.setState({
    integrations: [],
    isLoading: false,
  });
}

/**
 * Hook to synchronize authentication state across browser tabs.
 * 
 * When another tab logs in as a different user or logs out, this hook:
 * 1. Detects the localStorage change via the 'storage' event
 * 2. Clears all stores to prevent data leakage
 * 3. Redirects to the login page
 * 
 * This prevents the critical security issue where user A's tab could
 * display user B's data after B logs in on another tab.
 */
export function useAuthSync() {
  const navigate = useNavigate();
  const currentTokenRef = useRef<string | null>(null);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    // Store the current token when the hook initializes
    currentTokenRef.current = localStorage.getItem('auth_token');

    // Handler for storage events (fired when localStorage changes in another tab)
    const handleStorageChange = (event: StorageEvent) => {
      // Only care about auth_token changes
      if (event.key !== 'auth_token') return;

      const newToken = event.newValue;
      const oldToken = currentTokenRef.current;

      // Token changed in another tab
      if (newToken !== oldToken) {
        console.log('[AuthSync] Token changed in another tab, clearing data and redirecting');
        
        // Clear all stores immediately
        clearAllStores();
        
        // Update our reference
        currentTokenRef.current = newToken;

        // If token was removed (logout) or changed (different user login), redirect to login
        if (!newToken || (oldToken && newToken !== oldToken)) {
          // Store a flag to show a message on the login page
          sessionStorage.setItem('session_invalidated', 'true');
          
          // Small delay to ensure stores are cleared
          setTimeout(() => {
            navigate('/auth/login', { replace: true });
          }, 100);
        }
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  // Also track token changes within the same tab
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    // If we have a user but the token is gone or different, something is wrong
    if (user && !token) {
      console.log('[AuthSync] Token missing but user exists, clearing data');
      clearAllStores();
      navigate('/auth/login', { replace: true });
    }
    
    currentTokenRef.current = token;
  }, [user, navigate]);
}

/**
 * Hook to periodically verify the token hasn't changed.
 * This is a fallback for browsers that don't fire storage events reliably.
 */
export function useTokenVerification(intervalMs: number = 2000) {
  const navigate = useNavigate();
  const expectedTokenRef = useRef<string | null>(null);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!user) {
      expectedTokenRef.current = null;
      return;
    }

    // Store the expected token when user logs in
    expectedTokenRef.current = localStorage.getItem('auth_token');

    const checkToken = () => {
      const currentToken = localStorage.getItem('auth_token');
      const expectedToken = expectedTokenRef.current;

      // If we expect a token but it's gone or changed, another tab logged in/out
      if (expectedToken && currentToken !== expectedToken) {
        console.log('[TokenVerification] Token mismatch detected, clearing data');
        clearAllStores();
        navigate('/auth/login', { replace: true });
      }
    };

    const interval = setInterval(checkToken, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [user, navigate, intervalMs]);
}
