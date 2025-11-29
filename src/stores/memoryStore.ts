import { create } from 'zustand';
import type { Memory } from '../types';
import { memoryApi } from '../lib/api';
import { useWorkspaceStore } from './workspaceStore';

interface MemoryState {
  memories: Memory[];
  searchQuery: string;
  sortBy: 'recent' | 'title' | 'relevance';
  selectedMemoryId: string | null;
  isLoading: boolean;
  
  // Actions
  loadMemories: (workspaceId: string) => Promise<void>;
  addMemory: (workspaceId: string, memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'snippet' | 'workspaceId'>) => Promise<void>;
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'recent' | 'title' | 'relevance') => void;
  setSelectedMemory: (id: string | null) => void;
  reEmbedMemory: (id: string) => Promise<void>;
  
  // Selectors
  getMemoriesByWorkspace: (workspaceId: string) => Memory[];
  getMemoryById: (id: string) => Memory | undefined;
  getFilteredMemories: (workspaceId: string) => Memory[];
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  searchQuery: '',
  sortBy: 'recent',
  selectedMemoryId: null,
  isLoading: false,

  loadMemories: async (workspaceId: string) => {
    set({ isLoading: true });
    try {
      const { searchQuery, sortBy } = get();
      const response = await memoryApi.list(workspaceId, searchQuery || undefined, sortBy);
      const memories = response.memories.map(mem => ({
        ...mem,
        createdAt: new Date(mem.createdAt),
        updatedAt: new Date(mem.updatedAt),
      }));
      
      set({ memories, isLoading: false });
    } catch (error) {
      console.error('Failed to load memories:', error);
      set({ isLoading: false });
    }
  },

  addMemory: async (workspaceId: string, memoryData) => {
    try {
      const response = await memoryApi.create(workspaceId, {
        title: memoryData.title,
        content: memoryData.content,
        tags: memoryData.tags,
        metadata: memoryData.metadata,
      });
      
      const newMemory: Memory = {
        ...response,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
      
      set(state => ({ memories: [...state.memories, newMemory] }));
      
      // Update workspace stats
      const workspaceStore = useWorkspaceStore.getState();
      const workspace = workspaceStore.getWorkspaceById(workspaceId);
      if (workspace) {
        workspaceStore.updateWorkspaceStats(workspaceId, {
          totalMemories: workspace.stats.totalMemories + 1,
          totalEmbeddings: workspace.stats.totalEmbeddings + 1,
          lastActivity: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to add memory:', error);
      throw error;
    }
  },

  updateMemory: async (id: string, updates: Partial<Memory>) => {
    try {
      const response = await memoryApi.update(id, {
        title: updates.title,
        content: updates.content,
        tags: updates.tags,
        metadata: updates.metadata,
      });
      
      set(state => ({
        memories: state.memories.map(mem => 
          mem.id === id ? {
            ...response,
            createdAt: new Date(response.createdAt),
            updatedAt: new Date(response.updatedAt),
          } : mem
        ),
      }));
    } catch (error) {
      console.error('Failed to update memory:', error);
      throw error;
    }
  },

  deleteMemory: async (id: string) => {
    try {
      // Get the memory before deleting to know its workspace
      const memory = get().memories.find(mem => mem.id === id);
      
      await memoryApi.delete(id);
      set(state => ({
        memories: state.memories.filter(mem => mem.id !== id),
        selectedMemoryId: state.selectedMemoryId === id ? null : state.selectedMemoryId,
      }));
      
      // Update workspace stats
      if (memory) {
        const workspaceStore = useWorkspaceStore.getState();
        const workspace = workspaceStore.getWorkspaceById(memory.workspaceId);
        if (workspace) {
          workspaceStore.updateWorkspaceStats(memory.workspaceId, {
            totalMemories: Math.max(0, workspace.stats.totalMemories - 1),
            totalEmbeddings: Math.max(0, workspace.stats.totalEmbeddings - 1),
            lastActivity: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to delete memory:', error);
      throw error;
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSortBy: (sortBy: 'recent' | 'title' | 'relevance') => {
    set({ sortBy });
  },

  setSelectedMemory: (id: string | null) => {
    set({ selectedMemoryId: id });
  },

  reEmbedMemory: async (id: string) => {
    try {
      const response = await memoryApi.reEmbed(id);
      set(state => ({
        memories: state.memories.map(mem => 
          mem.id === id ? {
            ...response,
            createdAt: new Date(response.createdAt),
            updatedAt: new Date(response.updatedAt),
          } : mem
        ),
      }));
    } catch (error) {
      console.error('Failed to re-embed memory:', error);
      throw error;
    }
  },

  getMemoriesByWorkspace: (workspaceId: string) => {
    return get().memories.filter(mem => mem.workspaceId === workspaceId);
  },

  getMemoryById: (id: string) => {
    return get().memories.find(mem => mem.id === id);
  },

  getFilteredMemories: (workspaceId: string) => {
    const state = get();
    let filtered = state.memories.filter(mem => mem.workspaceId === workspaceId);
    
    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(mem => 
        mem.title.toLowerCase().includes(query) ||
        mem.content.toLowerCase().includes(query) ||
        mem.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    switch (state.sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'relevance':
        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
    }
    
    return filtered;
  },
}));
