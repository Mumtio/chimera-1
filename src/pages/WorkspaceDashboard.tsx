import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Database, Activity, Edit2, Check, X, MessageSquare, Plus } from 'lucide-react';
import { Container, StatCard, CyberButton, Grid, CyberCard } from '../components/ui';
import { NeuralLoadGraph } from '../components/features/NeuralLoadGraph';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { workspaceApi } from '../lib/api';
import { realtimeService } from '../lib/realtime';
import type { TimeSeriesData } from '../types';

export default function WorkspaceDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workspace = useWorkspaceStore(state => 
    state.workspaces.find(ws => ws.id === id)
  );
  const updateWorkspace = useWorkspaceStore(state => state.updateWorkspace);
  const { getConversationsByWorkspace } = useChatStore();
  const conversations = workspace ? getConversationsByWorkspace(workspace.id) : [];
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [neuralLoadData, setNeuralLoadData] = useState<TimeSeriesData[]>([]);
  const { isAuthenticated } = useAuthStore();
  const { loadWorkspaces } = useWorkspaceStore();
  const { loadConversations } = useChatStore();

  // Fetch neural load data from API
  const fetchNeuralLoadData = useCallback(() => {
    if (id) {
      workspaceApi.getDashboard(id)
        .then((data) => {
          const formattedData = data.neuralLoad.map((point) => ({
            timestamp: new Date(point.timestamp),
            value: point.value,
          }));
          setNeuralLoadData(formattedData);
        })
        .catch((err) => {
          console.error('Failed to load neural load data:', err);
        });
    }
  }, [id]);

  // Record load snapshot and fetch data
  const recordAndFetchLoad = () => {
    if (!id) return;
    workspaceApi.recordLoad(id)
      .then(() => {
        fetchNeuralLoadData();
      })
      .catch((err) => {
        console.error('Failed to record load snapshot:', err);
      });
  };

  // Initial load: record snapshot immediately and fetch data
  useEffect(() => {
    if (id) {
      // Record a snapshot immediately on page load
      recordAndFetchLoad();
    }
  }, [id]);

  // Record load snapshot every 5 minutes and refresh data
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      recordAndFetchLoad();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [id]);

  // Real-time polling for dashboard stats (every 10 seconds)
  const dashboardPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!id || !isAuthenticated || !realtimeService.connected) return;

    dashboardPollingRef.current = setInterval(() => {
      // Refresh workspace stats and conversations
      loadWorkspaces().catch(console.error);
      loadConversations(id).catch(console.error);
      fetchNeuralLoadData();
    }, 10000);

    return () => {
      if (dashboardPollingRef.current) {
        clearInterval(dashboardPollingRef.current);
      }
    };
  }, [id, isAuthenticated, loadWorkspaces, loadConversations, fetchNeuralLoadData]);

  const handleStartEditName = () => {
    setEditedName(workspace?.name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (workspace && editedName.trim()) {
      await updateWorkspace(workspace.id, { name: editedName.trim() });
      setIsEditingName(false);
    }
  };

  const handleStartEditDescription = () => {
    setEditedDescription(workspace?.description || '');
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (workspace) {
      await updateWorkspace(workspace.id, { description: editedDescription.trim() });
      setIsEditingDescription(false);
    }
  };

  if (!workspace) {
    return (
      <Container maxWidth="2xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-cyber text-error-red mb-4">
            Workspace Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            The requested workspace does not exist.
          </p>
          <CyberButton onClick={() => navigate('/app')}>
            Return to Dashboard
          </CyberButton>
        </div>
      </Container>
    );
  }

  const { stats } = workspace;

  return (
    <div className="relative min-h-screen circuit-bg">
      <Container maxWidth="full" className="py-8">
        <div className="scanlines">
          {/* Header */}
          <div className="mb-8">
            {/* Workspace Name */}
            {isEditingName ? (
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  className="text-4xl font-cyber text-neon-green bg-transparent border-b-2 border-neon-green outline-none px-2"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-2 text-neon-green hover:bg-neon-green/10 rounded transition-colors"
                  title="Save"
                >
                  <Check size={24} />
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-2 text-gray-400 hover:bg-gray-400/10 rounded transition-colors"
                  title="Cancel"
                >
                  <X size={24} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-2 group">
                <h1 className="text-4xl font-cyber text-neon-green glow-text">
                  {workspace.name}
                </h1>
                <button
                  onClick={handleStartEditName}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-neon-green transition-all"
                  title="Edit workspace name"
                >
                  <Edit2 size={20} />
                </button>
              </div>
            )}

            {/* Workspace Description */}
            {isEditingDescription ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDescription();
                    if (e.key === 'Escape') setIsEditingDescription(false);
                  }}
                  className="text-lg text-gray-400 bg-transparent border-b border-gray-400 outline-none px-2 flex-1"
                  placeholder="Add a description..."
                  autoFocus
                />
                <button
                  onClick={handleSaveDescription}
                  className="p-1 text-neon-green hover:bg-neon-green/10 rounded transition-colors"
                  title="Save"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => setIsEditingDescription(false)}
                  className="p-1 text-gray-400 hover:bg-gray-400/10 rounded transition-colors"
                  title="Cancel"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                {workspace.description ? (
                  <p className="text-gray-400 text-lg">{workspace.description}</p>
                ) : (
                  <p className="text-gray-600 text-lg italic">No description</p>
                )}
                <button
                  onClick={handleStartEditDescription}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-neon-green transition-all"
                  title="Edit description"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Stat Cards */}
          <Grid cols={2} gap="lg" className="mb-8">
            <StatCard
              label="Total Memories"
              value={stats.totalMemories}
              icon={Database}
              trend="up"
              glowColor="#00FFAA"
            />
            <StatCard
              label="System Load"
              value={`${stats.systemLoad}%`}
              icon={Activity}
              trend={stats.systemLoad > 70 ? 'up' : stats.systemLoad < 30 ? 'down' : 'neutral'}
              glowColor={stats.systemLoad > 70 ? '#FF0055' : '#00FFAA'}
            />
          </Grid>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Neural Load Graph */}
            <div className="lg:col-span-2">
              <NeuralLoadGraph 
                data={neuralLoadData}
                height={300}
                showGrid={true}
              />
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              <div className="relative bg-black border-2 border-deep-teal angular-frame p-6">
                <h3 className="text-xl font-cyber text-neon-green mb-4 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <CyberButton
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => navigate(`/app/model-select`)}
                  >
                    New Chat
                  </CyberButton>
                  <CyberButton
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => navigate(`/app/memories`)}
                  >
                    Memory Bank
                  </CyberButton>
                </div>
                
                <div className="mt-6 pt-6 border-t border-deep-teal">
                  <div className="text-sm text-gray-400 space-y-2">
                    <div className="flex justify-between">
                      <span>Conversations:</span>
                      <span className="text-neon-green font-bold">
                        {stats.totalConversations}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Activity:</span>
                      <span className="text-neon-green font-bold">
                        {stats.lastActivity.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="mt-6">
            <CyberCard title="Recent Neural Chats" glowBorder>
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No conversations yet</p>
                    <CyberButton
                      variant="primary"
                      size="sm"
                      className="mt-4"
                      onClick={() => navigate(`/app/model-select`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Start New Chat
                    </CyberButton>
                  </div>
                ) : (
                  <>
                    {conversations.slice(0, 5).map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => navigate(`/app/chat/${conv.id}`)}
                        className="w-full text-left p-3 rounded border border-deep-teal hover:border-neon-green hover:bg-neon-green/5 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white group-hover:text-neon-green transition-colors">
                              {conv.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                              {conv.messages?.length || 0} messages • {new Date(conv.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-neon-green transition-colors" />
                        </div>
                      </button>
                    ))}
                    {conversations.length > 5 && (
                      <button
                        onClick={() => navigate(`/app/chat`)}
                        className="w-full text-center p-2 text-sm text-neon-green hover:bg-neon-green/10 rounded transition-colors"
                      >
                        View all {conversations.length} conversations →
                      </button>
                    )}
                  </>
                )}
              </div>
            </CyberCard>
          </div>

        </div>
      </Container>
    </div>
  );
}
