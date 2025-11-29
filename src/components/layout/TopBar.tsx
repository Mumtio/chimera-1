import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useIntegrationStore } from '../../stores/integrationStore';
import { useAuthStore } from '../../stores/authStore';
import { InvitationInbox } from '../features/InvitationInbox';

export function TopBar() {
  const navigate = useNavigate();
  const { getActiveWorkspace } = useWorkspaceStore();
  const { getConnectedModels } = useIntegrationStore();
  const { logout, user } = useAuthStore();
  const activeWorkspace = getActiveWorkspace();
  const [connectedModels, setConnectedModels] = useState<any[]>([]);

  // Load connected models
  useEffect(() => {
    getConnectedModels().then(setConnectedModels);
  }, [getConnectedModels]);

  // System status based on integrations
  const systemStatus = connectedModels.length > 0 ? 'online' : 'offline';

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <header className="h-16 bg-lab-panel/95 backdrop-blur-md border-b border-lab-border flex items-center justify-between px-6 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-green/5 via-transparent to-neon-blue/5 pointer-events-none" />
      {/* Left: Logo and Workspace Name */}
      <div className="flex items-center gap-6 relative z-10">
        <Link 
          to="/" 
          className="text-neon-green font-cyber text-xl hover:text-neon-green/80 transition-colors flex items-center gap-2 focus-visible-ring"
          aria-label="Chimera Protocol - Go to home page"
        >
          <span className="text-2xl" aria-hidden="true">⚡</span>
          <span>CHIMERA</span>
        </Link>
        
        <div className="h-8 w-px bg-neon-green/20" aria-hidden="true" />
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Active Workspace</span>
          <span className="text-sm text-white font-medium" aria-live="polite">
            {activeWorkspace?.name || 'No Workspace'}
          </span>
        </div>
      </div>

      {/* Right: System Status and User */}
      <div className="flex items-center gap-6 relative z-10">
        {/* System Status Indicator */}
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <div className="relative" aria-hidden="true">
            <Activity className={`w-5 h-5 ${systemStatus === 'online' ? 'text-neon-green' : 'text-red-500'}`} />
            {systemStatus === 'online' && (
              <div className="absolute inset-0 animate-ping opacity-50">
                <Activity className="w-5 h-5 text-neon-green" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wider">System</span>
            <span className={`text-xs font-medium ${systemStatus === 'online' ? 'text-neon-green' : 'text-red-500'}`}>
              {systemStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-neon-green/20" aria-hidden="true" />

        {/* Invitation Inbox */}
        <InvitationInbox />

        <div className="h-8 w-px bg-neon-green/20" aria-hidden="true" />

        {/* User Info and Logout */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 uppercase tracking-wider">User</span>
            <span className="text-sm text-white font-medium">{user?.name || 'Guest'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-neon-green transition-colors rounded hover:bg-neon-green/10"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
