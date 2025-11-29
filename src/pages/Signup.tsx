import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { CyberButton, CyberInput, CyberCard, Container } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useChatStore } from '../stores/chatStore';
import { useMemoryStore } from '../stores/memoryStore';
import { useInvitationStore } from '../stores/invitationStore';
import { realtimeService } from '../lib/realtime';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, error, isAuthenticated } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Clear all data when signup page is loaded to prevent data leakage
  useEffect(() => {
    // Stop any existing polling
    realtimeService.disconnect();
    
    // Clear all stores
    useWorkspaceStore.setState({
      workspaces: [],
      activeWorkspaceId: null,
      previousWorkspaceId: null,
      isTransitioning: false,
      transitionProgress: 0,
      isLoading: false,
    });
    
    useChatStore.setState({
      conversations: [],
      activeConversationId: null,
      autoStore: true,
      isLoading: false,
    });
    
    useMemoryStore.setState({
      memories: [],
      searchQuery: '',
      sortBy: 'recent',
      selectedMemoryId: null,
      isLoading: false,
    });
    
    useInvitationStore.setState({
      invitations: [],
      isLoading: false,
    });
    
    // Clear any stale tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);

  const handleSignup = async () => {
    try {
      await signup(name, email, password);
      // Redirect to /app which will load workspaces and redirect to first one
      navigate('/app');
    } catch (err) {
      // Error is already set in the store
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Container maxWidth="md">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <UserPlus className="w-16 h-16 text-neon-green" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-neon-green font-cyber">
            Create Identity
          </h1>
          <p className="text-gray-400">
            Join the Chimera Protocol network
          </p>
        </div>

        <CyberCard>
          <div className="space-y-6 p-8">
            <div>
              <label className="block text-neon-green text-sm font-medium mb-2">
                Full Name
              </label>
              <CyberInput
                type="text"
                placeholder="Dr. Neural Scientist"
                value={name}
                onChange={setName}
              />
            </div>

            <div>
              <label className="block text-neon-green text-sm font-medium mb-2">
                Email Address
              </label>
              <CyberInput
                type="email"
                placeholder="user@chimera.io"
                value={email}
                onChange={setEmail}
              />
            </div>
            
            <div>
              <label className="block text-neon-green text-sm font-medium mb-2">
                Password
              </label>
              <CyberInput
                type="password"
                placeholder="Enter secure password"
                value={password}
                onChange={setPassword}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}. Please check your information and try again.
              </div>
            )}

            <CyberButton
              variant="primary"
              size="lg"
              onClick={handleSignup}
              className="w-full"
            >
              Sign Up
            </CyberButton>

            <div className="text-center">
              <button
                onClick={() => navigate('/auth/login')}
                className="text-neon-green hover:text-neon-green/80 transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </CyberCard>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Back to Landing
          </button>
        </div>
      </Container>
    </div>
  );
}
