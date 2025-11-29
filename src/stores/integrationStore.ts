import { create } from 'zustand';
import type { Integration, CognitiveModel } from '../types';
import { integrationApi } from '../lib/api';

interface IntegrationState {
  integrations: Integration[];
  isLoading: boolean;
  
  // Actions
  loadIntegrations: () => Promise<void>;
  saveApiKey: (provider: 'openai' | 'anthropic' | 'google' | 'deepseek', apiKey: string) => Promise<void>;
  testConnection: (provider: 'openai' | 'anthropic' | 'google' | 'deepseek') => Promise<boolean>;
  disableIntegration: (provider: 'openai' | 'anthropic' | 'google' | 'deepseek') => Promise<void>;
  updateIntegrationStatus: (provider: 'openai' | 'anthropic' | 'google' | 'deepseek', status: 'connected' | 'error' | 'disconnected', errorMessage?: string) => void;
  
  // Selectors
  getIntegrationByProvider: (provider: 'openai' | 'anthropic' | 'google' | 'deepseek') => Integration | undefined;
  getConnectedModels: () => Promise<CognitiveModel[]>;
  isProviderConnected: (provider: 'openai' | 'anthropic' | 'google' | 'deepseek') => boolean;
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  integrations: [],
  isLoading: false,

  loadIntegrations: async () => {
    set({ isLoading: true });
    try {
      const response = await integrationApi.list();
      const integrations = response.integrations.map(int => ({
        ...int,
        userId: int.id,
        lastTested: int.lastTested ? new Date(int.lastTested) : undefined,
      }));
      
      set({ integrations, isLoading: false });
    } catch (error) {
      console.error('Failed to load integrations:', error);
      set({ isLoading: false });
    }
  },

  saveApiKey: async (provider, apiKey) => {
    try {
      const existing = get().integrations.find(int => int.provider === provider);
      
      if (existing) {
        const response = await integrationApi.update(existing.id, apiKey);
        set(state => ({
          integrations: state.integrations.map(int =>
            int.provider === provider
              ? {
                  ...int,
                  apiKey: response.apiKey,
                  status: response.status,
                  lastTested: response.lastTested ? new Date(response.lastTested) : undefined,
                  errorMessage: response.errorMessage,
                }
              : int
          ),
        }));
      } else {
        const response = await integrationApi.create(provider, apiKey);
        const newIntegration: Integration = {
          ...response,
          userId: response.id,
          lastTested: response.lastTested ? new Date(response.lastTested) : undefined,
        };
        set(state => ({
          integrations: [...state.integrations, newIntegration],
        }));
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw error;
    }
  },

  testConnection: async (provider) => {
    try {
      const integration = get().integrations.find(int => int.provider === provider);
      
      if (!integration) {
        throw new Error('Integration not found');
      }
      
      const response = await integrationApi.test(integration.id);
      
      set(state => ({
        integrations: state.integrations.map(int =>
          int.provider === provider
            ? {
                ...int,
                status: response.integration.status,
                lastTested: response.integration.lastTested ? new Date(response.integration.lastTested) : undefined,
                errorMessage: response.integration.errorMessage,
              }
            : int
        ),
      }));
      
      return response.integration.status === 'connected';
    } catch (error) {
      console.error('Failed to test connection:', error);
      set(state => ({
        integrations: state.integrations.map(int =>
          int.provider === provider
            ? {
                ...int,
                status: 'error' as const,
                errorMessage: error instanceof Error ? error.message : 'Connection test failed',
              }
            : int
        ),
      }));
      return false;
    }
  },

  disableIntegration: async (provider) => {
    try {
      const integration = get().integrations.find(int => int.provider === provider);
      
      if (integration) {
        await integrationApi.delete(integration.id);
        set(state => ({
          integrations: state.integrations.filter(int => int.provider !== provider),
        }));
      }
    } catch (error) {
      console.error('Failed to disable integration:', error);
      throw error;
    }
  },

  updateIntegrationStatus: (provider, status, errorMessage) => {
    set(state => ({
      integrations: state.integrations.map(int =>
        int.provider === provider
          ? { ...int, status, errorMessage }
          : int
      ),
    }));
  },

  getIntegrationByProvider: (provider) => {
    return get().integrations.find(int => int.provider === provider);
  },

  getConnectedModels: async () => {
    try {
      const response = await integrationApi.getAvailableModels();
      return response.models.map(model => ({
        ...model,
        provider: model.provider as 'openai' | 'anthropic' | 'google' | 'deepseek',
        status: model.status as 'connected' | 'error' | 'disconnected',
      }));
    } catch (error) {
      console.error('Failed to get connected models:', error);
      return [];
    }
  },

  isProviderConnected: (provider) => {
    const integration = get().integrations.find(int => int.provider === provider);
    return integration?.status === 'connected';
  },
}));
