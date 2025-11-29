import React, { useState } from 'react';
import { UserPlus, MoreVertical, Shield, Eye, User, Circle } from 'lucide-react';
import { CyberButton } from '../components/ui/CyberButton';
import { CyberCard } from '../components/ui/CyberCard';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useAuthStore } from '../stores/authStore';
import { dummyUsers } from '../data/dummyData';
import { teamApi } from '../lib/api';
import type { TeamMember } from '../types';

const Team: React.FC = () => {
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore(state => state.workspaces);
  const currentUser = useAuthStore(state => state.user);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const teamMembers = currentWorkspace?.members || [];
  
  // Add current user to team if not already there
  const isCurrentUserInTeam = teamMembers.some(m => m.userId === currentUser?.id);
  const displayMembers = isCurrentUserInTeam ? teamMembers : [
    ...teamMembers,
    {
      id: 'current-user',
      userId: currentUser?.id || '',
      workspaceId: activeWorkspaceId || '',
      role: 'admin' as const,
      status: 'online' as const,
      joinedAt: new Date(),
    }
  ];

  const getUserInfo = (userId: string) => {
    return dummyUsers.find(u => u.id === userId);
  };

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online':
        return 'text-neon-green';
      case 'away':
        return 'text-yellow-400';
      case 'offline':
        return 'text-gray-500';
    }
  };

  const getStatusGlow = (status: TeamMember['status']) => {
    switch (status) {
      case 'online':
        return 'shadow-[0_0_10px_rgba(0,255,170,0.6)]';
      case 'away':
        return 'shadow-[0_0_10px_rgba(250,204,21,0.6)]';
      case 'offline':
        return 'shadow-[0_0_10px_rgba(107,114,128,0.3)]';
    }
  };

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} className="text-neon-green" />;
      case 'researcher':
        return <User size={16} className="text-neon-green" />;
      case 'observer':
        return <Eye size={16} className="text-neon-green" />;
    }
  };

  const getRoleLabel = (role: TeamMember['role']) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleInvite = async () => {
    if (!activeWorkspaceId || !inviteEmail) return;
    
    setInviteError(null);
    try {
      await teamApi.invite(activeWorkspaceId, inviteEmail);
      setInviteSuccess(true);
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteSuccess(false);
      }, 1500);
    } catch (error: any) {
      setInviteError(error.message || 'Failed to send invitation');
    }
  };

  const handleChangeRole = (memberId: string, newRole: TeamMember['role']) => {
    // In a real app, this would update the member's role
    console.log('Changing role for', memberId, 'to', newRole);
    setActionMenuOpen(null);
  };

  const handleRemoveMember = (memberId: string) => {
    // In a real app, this would remove the member
    if (confirm('Are you sure you want to remove this team member?')) {
      console.log('Removing member:', memberId);
      setActionMenuOpen(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 relative">
      {/* Holographic silhouette background effects */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-neon-green rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-green rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-cyber font-bold text-neon-green uppercase tracking-wider mb-2">
                Lab Personnel
              </h1>
              <p className="text-gray-400 text-sm">
                Manage research team access and collaboration permissions
              </p>
            </div>
            <CyberButton
              variant="primary"
              glow
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus size={18} className="inline mr-2" />
              Invite Researcher
            </CyberButton>
          </div>
        </div>

        {/* Team Members Table */}
        <CyberCard glowBorder={false} cornerAccents>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-deep-teal">
                  <th className="text-left py-4 px-4 text-neon-green font-cyber text-sm uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 text-neon-green font-cyber text-sm uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left py-4 px-4 text-neon-green font-cyber text-sm uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-4 px-4 text-neon-green font-cyber text-sm uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left py-4 px-4 text-neon-green font-cyber text-sm uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-right py-4 px-4 text-neon-green font-cyber text-sm uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayMembers.map((member) => {
                  const userInfo = member.userId === currentUser?.id ? currentUser : getUserInfo(member.userId);
                  if (!userInfo) return null;
                  const isCurrentUser = member.userId === currentUser?.id;

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-deep-teal/30 hover:bg-deep-teal/10 transition-colors"
                    >
                      {/* Status Indicator */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Circle
                            size={12}
                            className={`${getStatusColor(member.status)} ${getStatusGlow(member.status)} fill-current`}
                          />
                          <span className={`text-xs uppercase font-mono ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-deep-teal border-2 border-neon-green flex items-center justify-center">
                            <span className="text-neon-green font-bold text-sm">
                              {userInfo.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{userInfo.name}</span>
                            {isCurrentUser && (
                              <span className="text-neon-green text-xs font-mono px-2 py-0.5 bg-neon-green/10 border border-neon-green/30 rounded">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4">
                        <span className="text-gray-400 font-mono text-sm">{userInfo.email}</span>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          <span className="text-white text-sm">{getRoleLabel(member.role)}</span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4">
                        <span className="text-gray-400 text-sm font-mono">
                          {new Date(member.joinedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === member.id ? null : member.id)}
                            className="p-2 hover:bg-deep-teal/30 rounded transition-colors"
                            aria-label="Member actions"
                          >
                            <MoreVertical size={18} className="text-neon-green" />
                          </button>

                          {/* Action Dropdown Menu */}
                          {actionMenuOpen === member.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-black border-2 border-neon-green angular-frame shadow-neon z-20">
                              <div className="py-2">
                                <button
                                  onClick={() => handleChangeRole(member.id, 'admin')}
                                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-deep-teal/30 transition-colors"
                                  disabled={member.role === 'admin'}
                                >
                                  Change to Admin
                                </button>
                                <button
                                  onClick={() => handleChangeRole(member.id, 'researcher')}
                                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-deep-teal/30 transition-colors"
                                  disabled={member.role === 'researcher'}
                                >
                                  Change to Researcher
                                </button>
                                <button
                                  onClick={() => handleChangeRole(member.id, 'observer')}
                                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-deep-teal/30 transition-colors"
                                  disabled={member.role === 'observer'}
                                >
                                  Change to Observer
                                </button>
                                <div className="border-t border-deep-teal my-2"></div>
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-error-red hover:bg-error-red/10 transition-colors"
                                >
                                  Remove Member
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {teamMembers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">
                No team members yet. Invite researchers to collaborate.
              </p>
              <CyberButton
                variant="secondary"
                onClick={() => setShowInviteModal(true)}
              >
                Invite First Member
              </CyberButton>
            </div>
          )}
        </CyberCard>

        {/* Team Stats */}
        <div className="mt-8 grid grid-cols-3 gap-6">
          <CyberCard glowBorder={false}>
            <div className="text-center">
              <div className="text-3xl font-cyber text-neon-green mb-2">
                {teamMembers.length}
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">
                Total Members
              </div>
            </div>
          </CyberCard>

          <CyberCard glowBorder={false}>
            <div className="text-center">
              <div className="text-3xl font-cyber text-neon-green mb-2">
                {teamMembers.filter(m => m.status === 'online').length}
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">
                Online Now
              </div>
            </div>
          </CyberCard>

          <CyberCard glowBorder={false}>
            <div className="text-center">
              <div className="text-3xl font-cyber text-neon-green mb-2">
                {teamMembers.filter(m => m.role === 'admin').length}
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">
                Administrators
              </div>
            </div>
          </CyberCard>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md">
            <CyberCard title="Invite Researcher" glowBorder cornerAccents>
              <div className="space-y-4">
                {inviteSuccess ? (
                  <div className="text-center py-4">
                    <div className="text-neon-green text-lg mb-2">✓ Invitation Sent!</div>
                    <p className="text-gray-400 text-sm">
                      The user will see the invitation in their inbox.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => {
                          setInviteEmail(e.target.value);
                          setInviteError(null);
                        }}
                        placeholder="researcher@chimera.lab"
                        className="w-full px-4 py-3 bg-black border-2 border-deep-teal 
                                   text-neon-green font-mono text-sm
                                   focus:border-neon-green focus:shadow-neon focus:outline-none
                                   transition-all duration-300 angular-frame"
                      />
                    </div>

                    {inviteError && (
                      <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded p-2">
                        {inviteError}
                      </div>
                    )}

                    <div className="flex gap-4 mt-6">
                      <CyberButton
                        variant="primary"
                        glow
                        onClick={handleInvite}
                        disabled={!inviteEmail}
                        className="flex-1"
                      >
                        Send Invitation
                      </CyberButton>
                      <CyberButton
                        variant="secondary"
                        onClick={() => {
                          setShowInviteModal(false);
                          setInviteEmail('');
                          setInviteError(null);
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </CyberButton>
                    </div>
                  </>
                )}
              </div>
            </CyberCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
