// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

// Workspace Types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  stats: WorkspaceStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceStats {
  totalMemories: number;
  totalEmbeddings: number;
  totalConversations: number;
  systemLoad: number; // 0-100
  lastActivity: Date;
}

// Memory Types
export interface Memory {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  snippet: string; // First 150 chars
  tags: string[];
  embedding?: number[]; // Vector embedding
  metadata: {
    source?: string;
    conversationId?: string;
    modelUsed?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

// Conversation Types
export interface InjectedMemory {
  id: string;
  isActive: boolean;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  title: string;
  modelId: string;
  messages: Message[];
  injectedMemories: InjectedMemory[]; // Memory IDs with active status
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isPinned: boolean;
  metadata?: Record<string, any>;
}

// Cognitive Model Types
export interface CognitiveModel {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek';
  name: string;
  displayName: string;
  brainRegion: string; // e.g., "Left Cortex", "Right Cortex"
  status: 'connected' | 'error' | 'disconnected';
  apiKey?: string;
  position: Vector3; // 3D position for brain visualization
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Team Types
export interface TeamMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'admin' | 'researcher' | 'observer';
  status: 'online' | 'away' | 'offline';
  joinedAt: Date;
}

// Integration Types
export interface Integration {
  id: string;
  userId: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek';
  apiKey: string;
  status: 'connected' | 'error' | 'disconnected';
  lastTested?: Date;
  errorMessage?: string;
}

// Time Series Data for Charts
export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}
