import { create } from 'zustand';
import type { Workspace } from '../types';
import { workspaceApi } from '../lib/api';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  previousWorkspaceId: string | null;
  isTransitioning: boolean;
  transitionProgress: number;
  isLoading: boolean;
  
  // Actions
  loadWorkspaces: () => Promise<void>;
  setActiveWorkspace: (id: string) => void;
  createWorkspace: (name: string, description?: string) => Promise<void>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  startTransition: () => void;
  updateTransitionProgress: (progress: number) => void;
  completeTransition: () => void;
  
  // Stats
  updateWorkspaceStats: (id: string, statUpdates: Partial<Workspace['stats']>) => void;
  
  // Selectors
  getActiveWorkspace: () => Workspace | null;
  getWorkspaceById: (id: string) => Workspace | undefined;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  previousWorkspaceId: null,
  isTransitioning: false,
  transitionProgress: 0,
  isLoading: false,

  loadWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const response = await workspaceApi.list();
      const workspaces = response.workspaces.map(ws => ({
        ...ws,
        createdAt: new Date(ws.createdAt),
        updatedAt: new Date(ws.updatedAt),
        stats: {
          ...ws.stats,
          lastActivity: new Date(ws.stats.lastActivity),
        },
      }));
      
      set({ 
        workspaces,
        activeWorkspaceId: workspaces[0]?.id || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load workspaces:', error);
      set({ isLoading: false });
    }
  },

  setActiveWorkspace: (id: string) => {
    const currentId = get().activeWorkspaceId;
    if (currentId !== id) {
      set({ 
        previousWorkspaceId: currentId,
        isTransitioning: true, 
        transitionProgress: 0 
      });
      
      const duration = 3000;
      const intervalTime = 50;
      const steps = duration / intervalTime;
      const progressIncrement = 100 / steps;
      
      const interval = setInterval(() => {
        const progress = get().transitionProgress;
        if (progress >= 100) {
          clearInterval(interval);
          set({ 
            activeWorkspaceId: id, 
            isTransitioning: false, 
            transitionProgress: 0,
            previousWorkspaceId: null,
          });
        } else {
          set({ transitionProgress: Math.min(progress + progressIncrement, 100) });
        }
      }, intervalTime);
    }
  },

  createWorkspace: async (name: string, description?: string) => {
    try {
      const response = await workspaceApi.create(name, description);
      const newWorkspace: Workspace = {
        ...response,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
        stats: {
          ...response.stats,
          lastActivity: new Date(response.stats.lastActivity),
        },
      };
      
      set(state => ({ 
        workspaces: [...state.workspaces, newWorkspace],
        activeWorkspaceId: newWorkspace.id,
      }));
    } catch (error) {
      console.error('Failed to create workspace:', error);
      throw error;
    }
  },

  updateWorkspace: async (id: string, updates: Partial<Workspace>) => {
    try {
      const response = await workspaceApi.update(id, updates);
      set(state => ({
        workspaces: state.workspaces.map(ws => 
          ws.id === id ? {
            ...response,
            createdAt: new Date(response.createdAt),
            updatedAt: new Date(response.updatedAt),
            stats: {
              ...response.stats,
              lastActivity: new Date(response.stats.lastActivity),
            },
          } : ws
        ),
      }));
    } catch (error) {
      console.error('Failed to update workspace:', error);
      throw error;
    }
  },

  deleteWorkspace: async (id: string) => {
    try {
      await workspaceApi.delete(id);
      set(state => {
        const newWorkspaces = state.workspaces.filter(ws => ws.id !== id);
        const newActiveId = state.activeWorkspaceId === id 
          ? (newWorkspaces[0]?.id || null)
          : state.activeWorkspaceId;
        
        return {
          workspaces: newWorkspaces,
          activeWorkspaceId: newActiveId,
        };
      });
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      throw error;
    }
  },

  startTransition: () => {
    set({ isTransitioning: true, transitionProgress: 0 });
  },

  updateTransitionProgress: (progress: number) => {
    set({ transitionProgress: progress });
  },

  completeTransition: () => {
    set({ isTransitioning: false, transitionProgress: 0 });
  },

  updateWorkspaceStats: (id: string, statUpdates: Partial<Workspace['stats']>) => {
    set(state => ({
      workspaces: state.workspaces.map(ws =>
        ws.id === id
          ? {
              ...ws,
              stats: { ...ws.stats, ...statUpdates },
            }
          : ws
      ),
    }));
  },

  getActiveWorkspace: () => {
    const state = get();
    return state.workspaces.find(ws => ws.id === state.activeWorkspaceId) || null;
  },

  getWorkspaceById: (id: string) => {
    return get().workspaces.find(ws => ws.id === id);
  },
}));
