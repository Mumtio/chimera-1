import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvitationStore } from '../../stores/invitationStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';

export const InvitationInbox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  
  const { invitations, loadInvitations, acceptInvitation, declineInvitation, getPendingCount } =
    useInvitationStore();
  const { loadWorkspaces } = useWorkspaceStore();

  const pendingCount = getPendingCount();

  useEffect(() => {
    loadInvitations();
    // Poll for new invitations every 30 seconds
    const interval = setInterval(loadInvitations, 30000);
    return () => clearInterval(interval);
  }, [loadInvitations]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  const handleAccept = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      // Reload workspaces to include the new one
      await loadWorkspaces();
    } catch (error) {
      alert('Failed to accept invitation');
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      await declineInvitation(invitationId);
    } catch (error) {
      alert('Failed to decline invitation');
    }
  };

  return (
    <>
      {/* Inbox Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-neon-green transition-colors"
        title="Invitations"
      >
        <Mail size={20} />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-green text-black text-xs font-bold rounded-full flex items-center justify-center">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Dropdown rendered via portal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />

              {/* Dropdown Panel */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
                className="fixed w-80 bg-black border-2 border-neon-green rounded shadow-neon z-[101]"
              >
                <div className="p-3 border-b border-deep-teal">
                  <h3 className="text-neon-green font-cyber text-sm uppercase tracking-wider">
                    Workspace Invitations
                  </h3>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {invitations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No pending invitations
                    </div>
                  ) : (
                    invitations.map(invitation => (
                      <div
                        key={invitation.id}
                        className="p-3 border-b border-deep-teal/30 hover:bg-deep-teal/10"
                      >
                        <div className="mb-2">
                          <p className="text-white text-sm font-medium">
                            {invitation.workspaceName}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Invited by {invitation.inviterName}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(invitation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(invitation.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-neon-green/20 text-neon-green text-xs font-mono rounded hover:bg-neon-green/30 transition-colors"
                          >
                            <Check size={14} />
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(invitation.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-mono rounded hover:bg-red-500/30 transition-colors"
                          >
                            <X size={14} />
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
