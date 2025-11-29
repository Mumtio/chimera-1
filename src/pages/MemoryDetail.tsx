import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { CyberButton } from '../components/ui/CyberButton';
import { CyberInput } from '../components/ui/CyberInput';
import { useMemoryStore } from '../stores/memoryStore';

const MemoryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getMemoryById, updateMemory, deleteMemory } = useMemoryStore();
  
  const memory = id ? getMemoryById(id) : undefined;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedTags, setEditedTags] = useState('');

  useEffect(() => {
    if (memory) {
      setEditedTitle(memory.title);
      setEditedContent(memory.content);
      setEditedTags(memory.tags.join(', '));
    }
  }, [memory]);

  // Generate waveform path from embedding data
  const waveformPath = useMemo(() => {
    if (!memory?.embedding || memory.embedding.length === 0) {
      return null;
    }
    
    const embedding = memory.embedding;
    const points = 100;
    const step = Math.max(1, Math.floor(embedding.length / points));
    let path = 'M 0 64';
    
    for (let i = 0; i < points; i++) {
      const idx = Math.min(i * step, embedding.length - 1);
      const value = embedding[idx] || 0;
      const x = (i / points) * 800;
      const y = 64 + (value * 50);
      path += ` L ${x} ${Math.max(10, Math.min(118, y))}`;
    }
    
    return path;
  }, [memory?.embedding]);

  if (!memory) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-neon-green font-cyber mb-4">Memory Not Found</h2>
          <p className="text-gray-400 mb-6">The requested memory does not exist.</p>
          <CyberButton variant="primary" onClick={() => navigate('/app/memories')}>
            Return to Bank
          </CyberButton>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const handleSaveEdit = () => {
    if (!id) return;
    const tags = editedTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    updateMemory(id, { title: editedTitle, content: editedContent, tags });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(memory.title);
    setEditedContent(memory.content);
    setEditedTags(memory.tags.join(', '));
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!id) return;
    if (confirm(`Are you sure you want to delete "${memory.title}"? This action cannot be undone.`)) {
      deleteMemory(id);
      navigate('/app/memories');
    }
  };

  const hasEmbedding = memory.embedding && memory.embedding.length > 0;
  const embeddingDimensions = memory.embedding?.length || 0;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/app/memories')}
          className="flex items-center gap-2 text-neon-green hover:text-white transition-colors duration-200 mb-6 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="uppercase tracking-wider text-sm font-bold">Return to Bank</span>
        </button>

        {isEditing ? (
          <div className="mb-4">
            <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">Memory Title</label>
            <CyberInput type="text" value={editedTitle} onChange={setEditedTitle} placeholder="Enter memory title..." />
          </div>
        ) : (
          <h1 className="text-4xl font-cyber font-bold text-neon-green uppercase tracking-wider mb-2">{memory.title}</h1>
        )}

        <div className="flex gap-6 text-sm text-gray-400 font-mono">
          <div><span className="text-gray-500">Created:</span> <span className="text-neon-green">{formatDate(memory.createdAt)}</span></div>
          <div><span className="text-gray-500">Updated:</span> <span className="text-neon-green">{formatDate(memory.updatedAt)}</span></div>
          <div><span className="text-gray-500">Version:</span> <span className="text-neon-green">v{memory.version}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div className="bg-black border-2 border-deep-teal angular-frame p-6 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h3 className="text-neon-green font-cyber text-lg font-bold uppercase tracking-wider mb-4">Memory Content</h3>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-64 px-4 py-3 bg-black border-2 border-deep-teal text-gray-300 font-mono text-sm focus:border-neon-green focus:shadow-neon focus:outline-none transition-all duration-300 resize-none"
                placeholder="Enter memory content..."
              />
            ) : (
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{memory.content}</div>
            )}
          </motion.div>

          <motion.div className="bg-black border-2 border-deep-teal angular-frame p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <h3 className="text-neon-green font-cyber text-lg font-bold uppercase tracking-wider mb-4">Neural Signature</h3>
            <div className="relative h-32 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 800 128" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 255, 170, 0.1)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="800" height="128" fill="url(#grid)" />
                {waveformPath ? (
                  <>
                    <path d={waveformPath} fill="none" stroke="#00FFAA" strokeWidth="2" />
                    <path d={waveformPath} fill="none" stroke="#00FFAA" strokeWidth="4" opacity="0.3" filter="blur(4px)" />
                  </>
                ) : (
                  <>
                    <path d="M 0 64 L 800 64" fill="none" stroke="#666" strokeWidth="1" strokeDasharray="5,5" />
                    <text x="400" y="64" textAnchor="middle" fill="#666" fontSize="12">No embedding data</text>
                  </>
                )}
              </svg>
              <div className="absolute inset-0 scanlines pointer-events-none" />
            </div>
            <p className="text-gray-400 text-xs mt-4 font-mono">
              Embedding Dimensions: {embeddingDimensions > 0 ? embeddingDimensions : 'N/A'} | 
              Status: <span className={hasEmbedding ? 'text-neon-green' : 'text-yellow-400'}>{hasEmbedding ? 'Active' : 'Pending'}</span>
            </p>
          </motion.div>
        </div>


        <div className="lg:col-span-1">
          <motion.div className="bg-black border-2 border-deep-teal angular-frame p-6 mb-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <h3 className="text-neon-green font-cyber text-lg font-bold uppercase tracking-wider mb-4">Tags</h3>
            {isEditing ? (
              <div>
                <label className="block text-gray-400 text-xs mb-2">Comma-separated tags</label>
                <CyberInput type="text" value={editedTags} onChange={setEditedTags} placeholder="tag1, tag2, tag3" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1.5 text-xs bg-deep-teal border border-neon-green/30 text-neon-green rounded-sm font-mono uppercase tracking-wider">#{tag}</span>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div className="bg-black border-2 border-deep-teal angular-frame p-6 mb-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <h3 className="text-neon-green font-cyber text-lg font-bold uppercase tracking-wider mb-4">Actions</h3>
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <CyberButton variant="primary" glow onClick={handleSaveEdit} className="w-full"><Save size={16} className="inline mr-2" />Save Changes</CyberButton>
                  <CyberButton variant="secondary" onClick={handleCancelEdit} className="w-full"><X size={16} className="inline mr-2" />Cancel</CyberButton>
                </>
              ) : (
                <>
                  <CyberButton variant="primary" onClick={() => setIsEditing(true)} className="w-full"><Edit size={16} className="inline mr-2" />Edit Memory</CyberButton>
                  <CyberButton variant="danger" onClick={handleDelete} className="w-full"><Trash2 size={16} className="inline mr-2" />Delete Memory</CyberButton>
                </>
              )}
            </div>
          </motion.div>

          <motion.div className="bg-black border-2 border-deep-teal angular-frame p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <h3 className="text-neon-green font-cyber text-lg font-bold uppercase tracking-wider mb-4">Metadata</h3>
            <div className="space-y-3 text-sm font-mono">
              <div><span className="text-gray-500">Memory ID:</span><div className="text-neon-green break-all">{memory.id}</div></div>
              {memory.metadata.source && <div><span className="text-gray-500">Source:</span><div className="text-neon-green">{memory.metadata.source}</div></div>}
              {memory.metadata.conversationId && <div><span className="text-gray-500">Conversation:</span><div className="text-neon-green">{memory.metadata.conversationId}</div></div>}
              {memory.metadata.modelUsed && <div><span className="text-gray-500">Model Used:</span><div className="text-neon-green uppercase">{memory.metadata.modelUsed}</div></div>}
              <div><span className="text-gray-500">Workspace:</span><div className="text-neon-green">{memory.workspaceId}</div></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MemoryDetail;
