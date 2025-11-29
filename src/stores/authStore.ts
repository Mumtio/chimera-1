import { create } from 'zustand';
import type { User } from '../types';
import { authApi } from '../lib/api';
import { realtimeService } from '../lib/realtime';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: () => void;
  clearError: () => void;
  clearAllData: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authApi.login(email, password);
      
      // Store tokens
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refresh);
      
      // Convert user data
      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        avatar: response.user.avatar,
        createdAt: new Date(response.user.createdAt),
      };
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signup: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authApi.register(name, email, password);
      
      // Store tokens
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refresh);
      
      // Convert user data
      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        avatar: response.user.avatar,
        createdAt: new Date(response.user.createdAt),
      };
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    // Stop all realtime polling immediately
    realtimeService.disconnect();
    
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and state
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false });
      
      // Clear all other stores to prevent data leakage
      // Import stores dynamically to avoid circular dependencies
      import('./workspaceStore').then(({ useWorkspaceStore }) => {
        useWorkspaceStore.setState({
          workspaces: [],
          activeWorkspaceId: null,
          previousWorkspaceId: null,
          isTransitioning: false,
          transitionProgress: 0,
          isLoading: false,
        });
      });
      
      import('./chatStore').then(({ useChatStore }) => {
        useChatStore.setState({
          conversations: [],
          activeConversationId: null,
          autoStore: true,
          isLoading: false,
        });
      });
      
      import('./memoryStore').then(({ useMemoryStore }) => {
        useMemoryStore.setState({
          memories: [],
          searchQuery: '',
          sortBy: 'recent',
          selectedMemoryId: null,
          isLoading: false,
        });
      });
      
      import('./invitationStore').then(({ useInvitationStore }) => {
        useInvitationStore.setState({
          invitations: [],
          isLoading: false,
        });
      });
      
      import('./integrationStore').then(({ useIntegrationStore }) => {
        useIntegrationStore.setState({
          integrations: [],
          isLoading: false,
        });
      });
    }
  },

  demoLogin: () => {
    // For demo purposes - create a demo user without API call
    const user: User = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@chimera.lab',
      createdAt: new Date(),
    };
    set({ user, isAuthenticated: true });
  },

  clearError: () => {
    set({ error: null });
  },

  clearAllData: () => {
    // Stop realtime polling
    realtimeService.disconnect();
    
    // Clear auth state
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },
}));
