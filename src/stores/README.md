# Zustand Stores

This directory contains all the Zustand state management stores for the Chimera Protocol application.

## Stores Overview

### authStore
Manages user authentication state and actions.
- **State**: user, isAuthenticated, isLoading
- **Actions**: login, signup, logout

### workspaceStore
Manages workspace data and workspace switching with transitions.
- **State**: workspaces, activeWorkspaceId, isTransitioning, transitionProgress
- **Actions**: setActiveWorkspace, createWorkspace, updateWorkspace, deleteWorkspace
- **Selectors**: getActiveWorkspace, getWorkspaceById

### memoryStore
Manages memory bank data, search, and filtering.
- **State**: memories, searchQuery, sortBy, selectedMemoryId
- **Actions**: addMemory, updateMemory, deleteMemory, setSearchQuery, setSortBy, reEmbedMemory
- **Selectors**: getMemoriesByWorkspace, getMemoryById, getFilteredMemories

### chatStore
Manages conversations and messages.
- **State**: conversations, activeConversationId, autoStore
- **Actions**: createConversation, sendMessage, pinMessage, injectMemory, setAutoStore
- **Selectors**: getConversationsByWorkspace, getActiveConversation, getMessageById

### integrationStore
Manages API integrations for different AI providers.
- **State**: integrations
- **Actions**: saveApiKey, testConnection, disableIntegration
- **Selectors**: getIntegrationByProvider, getConnectedModels, isProviderConnected

### uiStore
Manages UI state like sidebars, modals, and notifications.
- **State**: leftSidebarCollapsed, rightSidebarCollapsed, isLoading, activeModal, theme, notifications
- **Actions**: toggleLeftSidebar, openModal, closeModal, addNotification, setTheme

## Usage Example

```typescript
import { useWorkspaceStore, useMemoryStore } from '@/stores';

function MyComponent() {
  // Access state
  const workspaces = useWorkspaceStore(state => state.workspaces);
  const activeWorkspace = useWorkspaceStore(state => state.getActiveWorkspace());
  
  // Access actions
  const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace);
  const addMemory = useMemoryStore(state => state.addMemory);
  
  // Use in component
  const handleWorkspaceChange = (id: string) => {
    setActiveWorkspace(id);
  };
  
  return (
    <div>
      {workspaces.map(ws => (
        <button key={ws.id} onClick={() => handleWorkspaceChange(ws.id)}>
          {ws.name}
        </button>
      ))}
    </div>
  );
}
```

## Dummy Data

All stores are pre-populated with dummy data from `src/data/dummyData.ts`:
- 3 workspaces: "Project Chimera Alpha", "Neural Net Optimizers", "Deep Sea Research"
- 5 memories with cyberpunk-themed content
- 2 conversations with messages
- 3 team members with different roles and statuses
- 3 integrations (OpenAI and Anthropic connected, Google disconnected)

This dummy data ensures the frontend can be fully demonstrated without a backend.
