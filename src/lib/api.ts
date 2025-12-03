/**
 * API Service Layer
 * Handles all HTTP requests to the Django backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://chimera-protocol-mad-scientist.onrender.com/api';

// Types for API responses
interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to make authenticated requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    // Handle error which could be a string or an object
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    if (errorData.error) {
      if (typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      } else if (typeof errorData.error === 'object') {
        // Handle validation errors object from serializers
        const errors = Object.entries(errorData.error)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        errorMessage = errors || 'Validation failed';
      }
    }
    throw new Error(errorMessage);
  }

  const result: ApiResponse<T> = await response.json();
  
  if (!result.ok) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data as T;
}

// ============================================
// AUTHENTICATION API
// ============================================

export interface AuthResponse {
  token: string;
  refresh: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    createdAt: string;
  };
}

export const authApi = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  refresh: async (refreshToken: string): Promise<{ token: string }> => {
    return apiRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  },

  logout: async (): Promise<void> => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },
};

// ============================================
// WORKSPACE API
// ============================================

export interface WorkspaceResponse {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: any[];
  stats: {
    totalMemories: number;
    totalEmbeddings: number;
    totalConversations: number;
    systemLoad: number;
    lastActivity: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const workspaceApi = {
  list: async (): Promise<{ workspaces: WorkspaceResponse[]; total: number }> => {
    return apiRequest('/workspaces');
  },

  create: async (name: string, description?: string): Promise<WorkspaceResponse> => {
    return apiRequest('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  get: async (workspaceId: string): Promise<WorkspaceResponse> => {
    return apiRequest(`/workspaces/${workspaceId}`);
  },

  update: async (workspaceId: string, updates: { name?: string; description?: string }): Promise<WorkspaceResponse> => {
    return apiRequest(`/workspaces/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (workspaceId: string): Promise<void> => {
    return apiRequest(`/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
  },

  getDashboard: async (workspaceId: string): Promise<{
    stats: any;
    neuralLoad: Array<{ timestamp: string; value: number }>;
    recentActivity: any[];
  }> => {
    return apiRequest(`/workspaces/${workspaceId}/dashboard`);
  },

  recordLoad: async (workspaceId: string): Promise<{ currentLoad: number }> => {
    return apiRequest(`/workspaces/${workspaceId}/record-load`, {
      method: 'POST',
    });
  },
};

// ============================================
// CONVERSATION API
// ============================================

export interface InjectedMemoryInfo {
  id: string;
  isActive: boolean;
}

export interface ConversationResponse {
  id: string;
  workspaceId: string;
  title: string;
  modelId: string;
  messages: MessageResponse[];
  injectedMemories: InjectedMemoryInfo[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isPinned: boolean;
  metadata?: any;
}

export const conversationApi = {
  list: async (workspaceId: string): Promise<{ conversations: ConversationResponse[]; total: number }> => {
    return apiRequest(`/workspaces/${workspaceId}/conversations`);
  },

  create: async (workspaceId: string, title: string, modelId: string): Promise<ConversationResponse> => {
    return apiRequest(`/workspaces/${workspaceId}/conversations`, {
      method: 'POST',
      body: JSON.stringify({ title, modelId }),
    });
  },

  get: async (conversationId: string): Promise<ConversationResponse> => {
    return apiRequest(`/conversations/${conversationId}`);
  },

  update: async (conversationId: string, updates: { title?: string; status?: string }): Promise<ConversationResponse> => {
    return apiRequest(`/conversations/${conversationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (conversationId: string): Promise<void> => {
    return apiRequest(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  },

  sendMessage: async (conversationId: string, content: string, getAiResponse: boolean = true): Promise<{
    userMessage: MessageResponse;
    assistantMessage?: MessageResponse;
  }> => {
    return apiRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, getAiResponse }),
    });
  },

  updateMessage: async (conversationId: string, messageId: string, updates: { isPinned?: boolean }): Promise<MessageResponse> => {
    return apiRequest(`/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteMessage: async (conversationId: string, messageId: string): Promise<void> => {
    return apiRequest(`/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  injectMemory: async (conversationId: string, memoryId: string): Promise<void> => {
    return apiRequest(`/conversations/${conversationId}/inject-memory`, {
      method: 'POST',
      body: JSON.stringify({ memoryId }),
    });
  },

  removeInjectedMemory: async (conversationId: string, memoryId: string): Promise<void> => {
    return apiRequest(`/conversations/${conversationId}/inject-memory/${memoryId}`, {
      method: 'DELETE',
    });
  },

  toggleInjectedMemory: async (conversationId: string, memoryId: string): Promise<{ memoryId: string; isActive: boolean }> => {
    return apiRequest(`/conversations/${conversationId}/inject-memory/${memoryId}/toggle`, {
      method: 'PUT',
    });
  },

  closeConversation: async (conversationId: string): Promise<{ conversation: ConversationResponse; memory?: any }> => {
    return apiRequest(`/conversations/${conversationId}/close`, {
      method: 'POST',
    });
  },

  reopenConversation: async (conversationId: string): Promise<{ conversation: ConversationResponse }> => {
    return apiRequest(`/conversations/${conversationId}/reopen`, {
      method: 'POST',
    });
  },
};

// ============================================
// MEMORY API
// ============================================

export interface MemoryResponse {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  snippet: string;
  tags: string[];
  embedding: any;
  metadata: any;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export const memoryApi = {
  list: async (workspaceId: string, search?: string, sortBy?: string): Promise<{ memories: MemoryResponse[]; total: number }> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/memories${query}`);
  },

  create: async (workspaceId: string, data: {
    title: string;
    content: string;
    tags?: string[];
    metadata?: any;
  }): Promise<MemoryResponse> => {
    return apiRequest(`/workspaces/${workspaceId}/memories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  get: async (memoryId: string): Promise<MemoryResponse> => {
    return apiRequest(`/memories/${memoryId}`);
  },

  update: async (memoryId: string, updates: {
    title?: string;
    content?: string;
    tags?: string[];
    metadata?: any;
  }): Promise<MemoryResponse> => {
    return apiRequest(`/memories/${memoryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (memoryId: string): Promise<void> => {
    return apiRequest(`/memories/${memoryId}`, {
      method: 'DELETE',
    });
  },

  reEmbed: async (memoryId: string): Promise<MemoryResponse> => {
    return apiRequest(`/memories/${memoryId}/re-embed`, {
      method: 'POST',
    });
  },

  search: async (query: string, workspaceId: string, topK: number = 5): Promise<{
    results: Array<{ id: string; title: string; snippet: string; score: number }>;
  }> => {
    return apiRequest('/memories/search', {
      method: 'POST',
      body: JSON.stringify({ query, workspaceId, top_k: topK }),
    });
  },

  importFromUrl: async (workspaceId: string, url: string, summarize: boolean = true): Promise<{
    memory: MemoryResponse;
    source_type: string;
    was_summarized: boolean;
  }> => {
    return apiRequest(`/workspaces/${workspaceId}/memories/import-url`, {
      method: 'POST',
      body: JSON.stringify({ url, summarize }),
    });
  },

  importFromFile: async (workspaceId: string, file: File, summarize: boolean = false): Promise<{
    memory: MemoryResponse;
    file_type: string;
    original_filename: string;
    was_summarized: boolean;
  }> => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('summarize', summarize.toString());

    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/memories/import-file`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data;
  },
};

// ============================================
// INTEGRATION API
// ============================================

export interface IntegrationResponse {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek';
  apiKey: string;
  status: 'connected' | 'error' | 'disconnected';
  lastTested?: string;
  errorMessage?: string;
}

export interface ModelResponse {
  id: string;
  provider: string;
  name: string;
  displayName: string;
  brainRegion: string;
  status: string;
  position: { x: number; y: number; z: number };
}

export const integrationApi = {
  list: async (): Promise<{ integrations: IntegrationResponse[]; total: number }> => {
    return apiRequest('/integrations');
  },

  create: async (provider: string, apiKey: string): Promise<IntegrationResponse> => {
    return apiRequest('/integrations', {
      method: 'POST',
      body: JSON.stringify({ provider, apiKey }),
    });
  },

  update: async (integrationId: string, apiKey: string): Promise<IntegrationResponse> => {
    return apiRequest(`/integrations/${integrationId}`, {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    });
  },

  delete: async (integrationId: string): Promise<void> => {
    return apiRequest(`/integrations/${integrationId}`, {
      method: 'DELETE',
    });
  },

  test: async (integrationId: string): Promise<{ integration: IntegrationResponse; message: string }> => {
    return apiRequest(`/integrations/${integrationId}/test`, {
      method: 'POST',
    });
  },

  getAvailableModels: async (): Promise<{ models: ModelResponse[]; total: number }> => {
    return apiRequest('/models/available');
  },
};

// ============================================
// TEAM API
// ============================================

export const teamApi = {
  list: async (workspaceId: string): Promise<any> => {
    return apiRequest(`/workspaces/${workspaceId}/team`);
  },

  invite: async (workspaceId: string, email: string): Promise<any> => {
    return apiRequest(`/workspaces/${workspaceId}/team/invite`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  updateRole: async (workspaceId: string, userId: string, role: string): Promise<any> => {
    return apiRequest(`/workspaces/${workspaceId}/team/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  updateStatus: async (workspaceId: string, userId: string, status: string): Promise<any> => {
    return apiRequest(`/workspaces/${workspaceId}/team/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  remove: async (workspaceId: string, userId: string): Promise<void> => {
    return apiRequest(`/workspaces/${workspaceId}/team/${userId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// INVITATION API
// ============================================

export interface InvitationResponse {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export const invitationApi = {
  list: async (): Promise<{ invitations: InvitationResponse[]; total: number }> => {
    return apiRequest('/invitations');
  },

  accept: async (invitationId: string): Promise<{ workspaceId: string; workspaceName: string }> => {
    return apiRequest(`/invitations/${invitationId}/accept`, {
      method: 'POST',
    });
  },

  decline: async (invitationId: string): Promise<void> => {
    return apiRequest(`/invitations/${invitationId}/decline`, {
      method: 'POST',
    });
  },
};

// ============================================
// SETTINGS API
// ============================================

export interface SettingsResponse {
  profile: {
    name: string;
    email: string;
  };
  memoryRetention: {
    autoStore: boolean;
    retentionPeriod: string;
  };
}

export interface CleanupInfoResponse {
  cleanup_date: string | null;
  days_remaining: number | null;
  hours_remaining: number | null;
  minutes_remaining: number | null;
  total_seconds_remaining: number | null;
  is_indefinite: boolean;
  retention_period: string;
}

export interface CleanupResultResponse {
  workspaces_deleted: number;
  conversations_deleted: number;
  memories_deleted: number;
  messages_deleted: number;
  cleanup_time: string;
}

export const settingsApi = {
  get: async (): Promise<SettingsResponse> => {
    return apiRequest('/settings');
  },

  updateProfile: async (data: { name?: string; email?: string }): Promise<SettingsResponse> => {
    return apiRequest('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateMemoryRetention: async (data: { autoStore?: boolean; retentionPeriod?: string }): Promise<SettingsResponse> => {
    return apiRequest('/settings/memory-retention', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getCleanupInfo: async (): Promise<CleanupInfoResponse> => {
    return apiRequest('/settings/cleanup-info');
  },

  triggerCleanup: async (): Promise<CleanupResultResponse> => {
    return apiRequest('/settings/cleanup', {
      method: 'POST',
    });
  },

  exportData: async (): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/export`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    
    if (!response.ok) {
      throw new Error('Failed to export data');
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chimera_data_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  deleteAccount: async (): Promise<void> => {
    return apiRequest('/account', {
      method: 'DELETE',
    });
  },
};

// ============================================
// MCP (Model Context Protocol) API
// ============================================

export interface McpRememberRequest {
  text: string;
  conversation_id: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface McpSearchRequest {
  query: string;
  top_k?: number;
  conversation_id?: string;
}

export interface McpInjectRequest {
  conversation_id: string;
  max_memories?: number;
}

export const mcpApi = {
  remember: async (data: McpRememberRequest): Promise<any> => {
    return apiRequest('/mcp/remember', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  search: async (data: McpSearchRequest): Promise<any> => {
    return apiRequest('/mcp/search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  inject: async (data: McpInjectRequest): Promise<any> => {
    return apiRequest('/mcp/inject', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  listMemories: async (conversationId: string, limit = 20, offset = 0): Promise<any> => {
    return apiRequest(`/mcp/listMemories?conversation_id=${conversationId}&limit=${limit}&offset=${offset}`);
  },
};

export { API_BASE_URL };
