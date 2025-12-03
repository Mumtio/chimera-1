import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Database, Zap, Edit2, X } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { useMemoryStore } from '../stores/memoryStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useAuthStore } from '../stores/authStore';
import { ChatMessage } from '../components/features/ChatMessage';
import { CyberButton } from '../components/ui/CyberButton';
import { CyberCard } from '../components/ui/CyberCard';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from '../components/ui/Toast';
import { SynapseSpark } from '../components/animations/SynapseSpark';
import { MemoryInjectionAnimation } from '../components/animations/MemoryInjectionAnimation';
import { useMessagePolling } from '../hooks/useRealtime';

const Chat: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  
  const [messageInput, setMessageInput] = useState('');
  const [sparkTrigger, setSparkTrigger] = useState<string | null>(null);
  const [injectingMemory, setInjectingMemory] = useState<{ id: string; title: string } | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    getConversationById,
    sendMessage,
    updateConversation,
    pinMessage,
    unpinMessage,
    deleteMessage,
    injectMemory,
    toggleInjectedMemory,
    getMessageById,
    loadConversationMessages,
    closeConversation,
    reopenConversation,
    isSending,
  } = useChatStore();

  const { getMemoriesByWorkspace, getMemoryById, loadMemories } = useMemoryStore();
  const { getActiveWorkspace } = useWorkspaceStore();
  const { isAuthenticated } = useAuthStore();

  const conversation = conversationId ? getConversationById(conversationId) : null;
  const activeWorkspace = getActiveWorkspace();
  const workspaceMemories = activeWorkspace ? getMemoriesByWorkspace(activeWorkspace.id) : [];

  // Enable real-time message polling for collaborative chat (disabled while sending)
  useMessagePolling(conversationId || null, isAuthenticated && conversation?.status === 'active' && !isSending);

  // Load conversation messages when conversation ID changes
  useEffect(() => {
    if (conversationId) {
      loadConversationMessages(conversationId);
    }
  }, [conversationId, loadConversationMessages]);

  // Note: Removed auto-reopen - conversations stay completed after closing
  // Users can manually continue chatting which will reopen the conversation

  // Track previous message count to only scroll on new messages
  const prevMessageCountRef = useRef(0);
  
  // Auto-scroll to bottom only when new messages are added
  useEffect(() => {
    const currentCount = conversation?.messages?.length || 0;
    const prevCount = prevMessageCountRef.current;
    
    // Only scroll if messages were added (not on initial load or updates)
    if (currentCount > prevCount && prevCount > 0) {
      if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    prevMessageCountRef.current = currentCount;
  }, [conversation?.messages?.length]);
  
  // Initial scroll to bottom when conversation loads
  useEffect(() => {
    if (conversation?.messages?.length && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [conversationId]);

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <CyberCard title="Conversation Not Found" glowBorder>
          <p className="text-gray-400 mb-4">The requested conversation could not be found.</p>
          <CyberButton onClick={() => navigate('/app/workspace/' + activeWorkspace?.id)}>
            Return to Dashboard
          </CyberButton>
        </CyberCard>
      </div>
    );
  }

  // Memoize handlers to prevent unnecessary re-renders
  const handleSendMessage = useCallback(async () => {
    if (messageInput.trim() && conversationId) {
      // If conversation is completed, reopen it first
      if (conversation?.status === 'completed') {
        try {
          await reopenConversation(conversationId);
        } catch (err) {
          console.error('Failed to reopen conversation:', err);
        }
      }
      sendMessage(conversationId, messageInput.trim());
      setMessageInput('');
    }
  }, [messageInput, conversationId, sendMessage, conversation?.status, reopenConversation]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage, isSending]);

  const handlePinMessage = useCallback((messageId: string) => {
    if (!conversation) return;
    const message = getMessageById(messageId);
    if (message?.isPinned) {
      unpinMessage(conversation.id, messageId);
    } else {
      pinMessage(conversation.id, messageId);
    }
  }, [conversation, getMessageById, unpinMessage, pinMessage]);

  const handleCopyMessage = useCallback((messageId: string) => {
    // Copy functionality is handled in ChatMessage component
    console.log('Message copied:', messageId);
  }, []);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (!conversation) return;
    setDeleteMessageId(messageId);
  }, [conversation]);

  const confirmDeleteMessage = useCallback(() => {
    if (!conversation || !deleteMessageId) return;
    deleteMessage(conversation.id, deleteMessageId);
    setDeleteMessageId(null);
  }, [conversation, deleteMessageId, deleteMessage]);

  const handleInjectMemory = useCallback((memoryId: string) => {
    if (conversationId) {
      const memory = getMemoryById(memoryId);
      if (memory) {
        // Show injection animation
        setInjectingMemory({ id: memoryId, title: memory.title });
        
        // Inject memory after a short delay
        setTimeout(() => {
          injectMemory(conversationId, memoryId);
          setSparkTrigger(memoryId);
          setTimeout(() => setSparkTrigger(null), 100);
        }, 300);
      }
    }
  }, [conversationId, injectMemory, getMemoryById]);

  const isMemoryInjected = useCallback((memoryId: string) => {
    return conversation?.injectedMemories?.some(m => m.id === memoryId) || false;
  }, [conversation?.injectedMemories]);

  const isMemoryActive = useCallback((memoryId: string) => {
    const injected = conversation?.injectedMemories?.find(m => m.id === memoryId);
    return injected?.isActive ?? false;
  }, [conversation?.injectedMemories]);

  const handleToggleMemory = useCallback((memoryId: string) => {
    if (conversationId) {
      toggleInjectedMemory(conversationId, memoryId);
    }
  }, [conversationId, toggleInjectedMemory]);

  const handleCloseConversation = useCallback(() => {
    if (!conversationId || !activeWorkspace) return;
    setShowCloseDialog(true);
  }, [conversationId, activeWorkspace]);

  const confirmCloseConversation = useCallback(async () => {
    if (!conversationId || !activeWorkspace) return;
    try {
      await closeConversation(conversationId);
      // Refresh memories to show the newly created memory from the conversation
      await loadMemories(activeWorkspace.id);
      setShowCloseDialog(false);
      toast.success('Conversation closed', 'Memory created from conversation.');
      navigate(`/app/workspace/${activeWorkspace.id}`);
    } catch (error) {
      console.error('Failed to close conversation:', error);
      toast.error('Failed to close conversation', 'Please try again.');
    }
  }, [conversationId, activeWorkspace, closeConversation, loadMemories, navigate]);



  return (
    <>
      {/* Delete Message Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteMessageId}
        onClose={() => setDeleteMessageId(null)}
        onConfirm={confirmDeleteMessage}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
        confirmText="Delete"
        variant="danger"
      />

      {/* Close Conversation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onConfirm={confirmCloseConversation}
        title="Close Conversation"
        message="Close this conversation? It will be summarized and saved to memory."
        confirmText="Close"
        variant="warning"
      />

      {/* Memory Injection Animation Overlay */}
      <AnimatePresence>
        {injectingMemory && (
          <MemoryInjectionAnimation
            memoryTitle={injectingMemory.title}
            onComplete={() => setInjectingMemory(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex h-full overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
        {/* Conversation Header */}
        <div className="border-b-2 border-deep-teal bg-black/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && conversation) {
                        updateConversation(conversation.id, { title: editedTitle.trim() });
                        setIsEditingTitle(false);
                      }
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    className="text-2xl font-cyber font-bold text-neon-green uppercase tracking-wider bg-transparent border-b-2 border-neon-green outline-none px-2"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (conversation) {
                        updateConversation(conversation.id, { title: editedTitle.trim() });
                        setIsEditingTitle(false);
                      }
                    }}
                    className="p-1 text-neon-green hover:bg-neon-green/10 rounded"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setIsEditingTitle(false)}
                    className="p-1 text-gray-400 hover:bg-gray-400/10 rounded"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl font-cyber font-bold text-neon-green uppercase tracking-wider">
                    {conversation.title}
                  </h1>
                  <button
                    onClick={() => {
                      setEditedTitle(conversation.title);
                      setIsEditingTitle(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-neon-green transition-all"
                    title="Edit title"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-400">
                  Status: <span className="text-neon-green">{conversation.status}</span>
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">
                  Model: <span className="text-neon-green">{conversation.modelId}</span>
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">
                  {conversation.messages.length} messages
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CyberButton 
                variant="danger" 
                size="sm"
                onClick={handleCloseConversation}
                title="Close conversation and save to memory"
              >
                <X className="w-4 h-4 mr-2" />
                Close Conversation
              </CyberButton>
              <Link to="/app/memories">
                <CyberButton variant="secondary" size="sm">
                  <Database className="w-4 h-4 mr-2" />
                  Memory Bank
                </CyberButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden bg-black/30 scanlines">
          <div className="h-full overflow-y-auto p-6 custom-scrollbar flex flex-col">
            {conversation.messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Zap className="w-16 h-16 text-neon-green mx-auto mb-4 animate-pulse-glow" />
                  <p className="text-gray-400 text-lg">
                    Start a conversation with the cognitive model
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Injected memories will be available in the context
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 min-h-full justify-end">
                {conversation.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onPin={handlePinMessage}
                    onCopy={handleCopyMessage}
                    onDelete={handleDeleteMessage}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Message Input Area */}
        <div className="border-t-2 border-deep-teal bg-black/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="
                  w-full px-4 py-3 bg-black border-2 border-deep-teal
                  text-white font-mono text-sm
                  focus:border-neon-green focus:shadow-neon
                  transition-all duration-300
                  focus:outline-none
                  resize-none
                  angular-frame
                "
                rows={3}
              />
            </div>
            <CyberButton
              variant="primary"
              size="lg"
              glow
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isSending}
            >
              <Send className="w-5 h-5 mr-2" />
              {isSending ? 'Sending...' : 'Send'}
            </CyberButton>
          </div>
          
          {/* Injected Memories Count */}
          <div className="flex items-center justify-end mt-3 pt-3 border-t border-deep-teal/50">
            <div className="text-xs text-gray-600 font-mono">
              {conversation.injectedMemories?.length || 0} memories injected
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Injectable Memories */}
      <div className="w-80 border-l-2 border-deep-teal bg-black/50 flex flex-col">
        <div className="p-4 border-b-2 border-deep-teal">
          <h2 className="text-lg font-cyber font-bold text-neon-green uppercase tracking-wider">
            Injectable Memories
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Auto-generated conversation summaries
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {workspaceMemories.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No memories available yet</p>
              <p className="text-gray-600 text-xs mt-2">
                Memories are auto-generated from conversations
              </p>
            </div>
          ) : (
            workspaceMemories.map((memory) => {
              const isInjected = isMemoryInjected(memory.id);
              const isActive = isMemoryActive(memory.id);
              return (
                <div key={memory.id} className="relative">
                  <motion.div
                    className={`
                      p-3 border-2 rounded
                      transition-all duration-300
                      ${isInjected 
                        ? isActive
                          ? 'border-neon-green bg-neon-green/10'
                          : 'border-yellow-500 bg-yellow-500/10'
                        : 'border-deep-teal hover:border-neon-green hover:shadow-neon cursor-pointer'
                      }
                    `}
                    onClick={() => !isInjected && handleInjectMemory(memory.id)}
                    whileHover={!isInjected ? { scale: 1.02 } : {}}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`text-sm font-bold line-clamp-1 ${isInjected && !isActive ? 'text-yellow-500' : 'text-neon-green'}`}>
                        {memory.title}
                      </h3>
                      {isInjected && (
                        <Zap 
                          className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-neon-green' : 'text-yellow-500'}`} 
                          fill={isActive ? 'currentColor' : 'none'} 
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {memory.snippet}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {memory.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-deep-teal/50 text-neon-green rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {/* Toggle button for injected memories */}
                    {isInjected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMemory(memory.id);
                        }}
                        className={`
                          mt-2 w-full py-1 text-xs font-mono rounded
                          transition-colors duration-200
                          ${isActive 
                            ? 'bg-neon-green/20 text-neon-green hover:bg-neon-green/30' 
                            : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                          }
                        `}
                      >
                        {isActive ? '● ACTIVE' : '○ PAUSED'}
                      </button>
                    )}
                  </motion.div>
                  {sparkTrigger === memory.id && <SynapseSpark trigger={true} />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Chat;
