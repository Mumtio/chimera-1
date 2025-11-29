import { Outlet } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { TopBar } from '../components/layout/TopBar';
import { RightSidebar } from '../components/layout/RightSidebar';
import { WorkspaceTransition } from '../components/animations/WorkspaceTransition';
import { CyberSpinner } from '../components/ui';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useIntegrationStore } from '../stores/integrationStore';
import { useChatStore } from '../stores/chatStore';
import { useMemoryStore } from '../stores/memoryStore';
import { useAuthStore } from '../stores/authStore';
import { 
  useRealtimeConnection,
  useWorkspacePolling,
  useConversationPolling,
  useMemoryPolling,
  useInvitationPolling,
} from '../hooks/useRealtime';
import { useAuthSync, useTokenVerification } from '../hooks/useAuthSync';

export default function AppShell() {
  const { 
    createWorkspace, 
    isTransitioning, 
    transitionProgress,
    previousWorkspaceId,
    getActiveWorkspace,
    getWorkspaceById,
    loadWorkspaces,
  } = useWorkspaceStore();
  const { loadIntegrations } = useIntegrationStore();
  const { loadConversations } = useChatStore();
  const { loadMemories } = useMemoryStore();
  const { isAuthenticated } = useAuthStore();
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get auth token for realtime connection
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // Cross-tab authentication synchronization
  // Detects when another tab logs in as a different user and clears data
  useAuthSync();
  useTokenVerification(3000); // Check every 3 seconds as fallback

  // Initialize realtime connection
  useRealtimeConnection(isAuthenticated, authToken);

  // Get active workspace
  const activeWorkspace = getActiveWorkspace();

  // Enable realtime polling for collaborative updates
  useWorkspacePolling(isAuthenticated && isInitialized);
  useConversationPolling(activeWorkspace?.id || null, isAuthenticated && isInitialized);
  useMemoryPolling(activeWorkspace?.id || null, isAuthenticated && isInitialized);
  useInvitationPolling(isAuthenticated && isInitialized);

  const previousWorkspace = previousWorkspaceId ? getWorkspaceById(previousWorkspaceId) : null;

  // Load initial data on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await loadWorkspaces();
        await loadIntegrations();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // Still set to true to show the app
      }
    };
    
    initialize();
  }, [loadWorkspaces, loadIntegrations]);

  // Load workspace-specific data when active workspace changes
  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (activeWorkspace) {
        try {
          // Load conversations and memories for the active workspace
          await loadConversations(activeWorkspace.id);
          await loadMemories(activeWorkspace.id);
        } catch (error) {
          console.error('Failed to load workspace data:', error);
        }
      }
    };
    
    loadWorkspaceData();
  }, [activeWorkspace?.id, loadConversations, loadMemories]);

  // Right sidebar is always hidden
  const hideRightSidebar = true;

  const handleNewWorkspace = () => {
    // For now, create a simple workspace with a default name
    // In a real app, this would open a modal
    const workspaceName = `Workspace ${Date.now()}`;
    createWorkspace(workspaceName, 'New workspace description');
    setShowNewWorkspaceModal(false);
  };

  return (
    <div className="h-screen flex flex-col bg-lab-dark text-white overflow-hidden relative">
      {/* Lab Background Effects */}
      <div className="absolute inset-0 lab-grid opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Workspace Transition Overlay */}
      <WorkspaceTransition
        isTransitioning={isTransitioning}
        progress={transitionProgress}
        fromWorkspace={previousWorkspace?.name}
        toWorkspace={activeWorkspace?.name}
      />

      {/* Top Bar */}
      <TopBar />

      {/* Main Content Area with Sidebars */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Hidden on tablet and below */}
        <div className="hidden laptop:block">
          <LeftSidebar onNewWorkspace={handleNewWorkspace} />
        </div>

        {/* Main Content */}
        <main 
          id="main-content" 
          className="flex-1 overflow-y-auto bg-black custom-scrollbar"
          role="main"
          aria-label="Main content"
        >
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <CyberSpinner size="lg" variant="ring" />
                <p className="text-neon-green mt-4 font-mono text-sm animate-pulse">
                  Loading Module...
                </p>
              </div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>

        {/* Right Sidebar - Hidden on tablet and below, and on memory pages */}
        {!hideRightSidebar && (
          <div className="hidden desktop:block">
            <RightSidebar />
          </div>
        )}
      </div>
    </div>
  );
}
