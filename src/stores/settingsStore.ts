import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsApi } from '../lib/api';

export interface UserSettings {
  profile: {
    name: string;
    email: string;
  };
  memoryRetention: {
    autoStore: boolean;
    retentionPeriod: string;
  };
}

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  updateMemoryRetention: (autoStore: boolean, retentionPeriod: string) => Promise<void>;
  exportData: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  setSettings: (settings: UserSettings) => void;
  clearError: () => void;
}

const defaultSettings: UserSettings = {
  profile: {
    name: '',
    email: '',
  },
  memoryRetention: {
    autoStore: true,
    retentionPeriod: 'indefinite-84',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      isLoading: false,
      error: null,

      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await settingsApi.get();
          set({
            settings: {
              profile: data.profile,
              memoryRetention: data.memoryRetention,
            },
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch settings', isLoading: false });
        }
      },

      updateProfile: async (name: string, email: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await settingsApi.updateProfile({ name, email });
          set({
            settings: {
              profile: data.profile,
              memoryRetention: data.memoryRetention,
            },
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message || 'Failed to update profile', isLoading: false });
          throw error;
        }
      },

      updateMemoryRetention: async (autoStore: boolean, retentionPeriod: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await settingsApi.updateMemoryRetention({ autoStore, retentionPeriod });
          set({
            settings: {
              profile: data.profile,
              memoryRetention: data.memoryRetention,
            },
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message || 'Failed to update memory retention', isLoading: false });
          throw error;
        }
      },

      exportData: async () => {
        set({ isLoading: true, error: null });
        try {
          await settingsApi.exportData();
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to export data', isLoading: false });
          throw error;
        }
      },

      deleteAccount: async () => {
        if (!confirm('Are you sure you want to delete your Chimera Protocol account? This action cannot be undone.')) {
          return false;
        }
        
        set({ isLoading: true, error: null });
        try {
          await settingsApi.deleteAccount();
          set({ settings: defaultSettings, isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete account', isLoading: false });
          throw error;
        }
      },

      setSettings: (settings: UserSettings) => {
        set({ settings });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'chimera-settings-storage',
    }
  )
);
