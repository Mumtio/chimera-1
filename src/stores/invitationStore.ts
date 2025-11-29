import { create } from 'zustand';
import { invitationApi, type InvitationResponse } from '../lib/api';

interface Invitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

interface InvitationState {
  invitations: Invitation[];
  isLoading: boolean;

  // Actions
  loadInvitations: () => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<{ workspaceId: string; workspaceName: string }>;
  declineInvitation: (invitationId: string) => Promise<void>;

  // Selectors
  getPendingCount: () => number;
}

export const useInvitationStore = create<InvitationState>((set, get) => ({
  invitations: [],
  isLoading: false,

  loadInvitations: async () => {
    set({ isLoading: true });
    try {
      const response = await invitationApi.list();
      const invitations = response.invitations.map((inv: InvitationResponse) => ({
        ...inv,
        createdAt: new Date(inv.createdAt),
      }));
      set({ invitations, isLoading: false });
    } catch (error) {
      console.error('Failed to load invitations:', error);
      set({ isLoading: false });
    }
  },

  acceptInvitation: async (invitationId: string) => {
    try {
      const result = await invitationApi.accept(invitationId);
      set(state => ({
        invitations: state.invitations.filter(inv => inv.id !== invitationId),
      }));
      return result;
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  },

  declineInvitation: async (invitationId: string) => {
    try {
      await invitationApi.decline(invitationId);
      set(state => ({
        invitations: state.invitations.filter(inv => inv.id !== invitationId),
      }));
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      throw error;
    }
  },

  getPendingCount: () => {
    return get().invitations.filter(inv => inv.status === 'pending').length;
  },
}));
