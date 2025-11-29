import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Calendar, Brain, Trash2 } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useIntegrationStore } from '../stores/integrationStore';
import { CyberCard } from '../components/ui';
import type { CognitiveModel } from '../types';

export default function ChatList() {
  const navigate = useNavigate();
  const { conversations, deleteConversation } = useChatStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const { getConnectedModels } = useIntegrationStore();
  const [connectedModels, setConnectedModels] = useState<CognitiveModel[]>([]);
  
  // Load connected models
  useEffect(() => {
    getConnectedModels().then(setConnectedModels).catch(() => setConnectedModels([]));
  }, [getConnectedModels]);
  
  const workspaceConversations = conversations.filter(
    conv => conv.workspaceId === activeWorkspaceId
  );

  const getModelName = (modelId: string) => {
    const model = connectedModels.find(m => m.id === modelId);
    return model?.displayName || 'Unknown Model';
  };

  const formatDate = (date: Date) => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-cyber text-neon-green mb-2">
              Neural Chat
            </h1>
            <p className="text-gray-400 text-sm">
              Manage conversations across multiple cognitive models
            </p>
          </div>
          
          <button
            onClick={() => navigate('/app/model-select')}
            className="flex items-center gap-2 px-6 py-3 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded hover:bg-neon-green/20 transition-all"
          >
            <Plus size={20} />
            <span className="font-medium">New Chat</span>
          </button>
        </div>
      </div>

      {/* Chat Room Grid */}
      {workspaceConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <MessageSquare className="w-16 h-16 text-neon-green/30 mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">No conversations yet</h3>
          <p className="text-gray-500 text-sm mb-6">
            Start a new chat to begin your cognitive fusion journey
          </p>
          <button
            onClick={() => navigate('/app/model-select')}
            className="flex items-center gap-2 px-6 py-3 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded hover:bg-neon-green/20 transition-all"
          >
            <Plus size={20} />
            <span>Create First Chat</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaceConversations.map((conversation) => (
            <CyberCard
              key={conversation.id}
              className="cursor-pointer hover:border-neon-green/50 transition-all"
              onClick={() => navigate(`/app/chat/${conversation.id}`)}
            >
              <div className="p-6">
                {/* Title */}
                <h3 className="text-lg font-medium text-white mb-3 truncate">
                  {conversation.title}
                </h3>

                {/* Model Info */}
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <Brain className="w-4 h-4 text-neon-green" />
                  <span className="text-neon-green">
                    {getModelName(conversation.modelId)}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(conversation.updatedAt)}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-neon-green/10">
                  <span>{conversation.messages?.length || (conversation as any).messageCount || 0} messages</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded ${
                      conversation.status === 'active' 
                        ? 'bg-neon-green/10 text-neon-green' 
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {conversation.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${conversation.title}"? This cannot be undone.`)) {
                          deleteConversation(conversation.id);
                        }
                      }}
                      className="p-1.5 hover:bg-error-red/20 rounded transition-colors group"
                      title="Delete conversation"
                    >
                      <Trash2 size={14} className="text-gray-500 group-hover:text-error-red" />
                    </button>
                  </div>
                </div>
              </div>
            </CyberCard>
          ))}
        </div>
      )}
    </div>
  );
}
