import React, { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Copy, Trash2 } from 'lucide-react';
import type { Message } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface ChatMessageProps {
  message: Message;
  onPin: (id: string) => void;
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  onPin,
  onCopy,
  onDelete,
  showActions = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isUser = message.role === 'user';
  const isTyping = message.metadata?.isTyping === true;

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    onCopy(message.id);
  }, [message.content, message.id, onCopy]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }
}
      exit={{ opacity: 0, x: -20 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-label={`Message from ${isUser ? 'you' : 'AI assistant'} at ${formatTimestamp(message.timestamp)}`}
    >
      <div className={`max-w-[70%] tablet:max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender Label */}
        <div className="flex items-center gap-2 mb-1 px-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-xs text-gray-600">•</span>
          <span className="text-xs text-gray-500 font-mono">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.isPinned && (
            <Pin className="w-3 h-3 text-neon-green" fill="currentColor" />
          )}
        </div>

        {/* Message Bubble */}
        <div className="relative">
          <motion.div
            className={`
              relative px-4 py-3 rounded-lg
              ${isUser 
                ? 'bg-neon-green/10 border-2 border-neon-green text-white' 
                : 'bg-deep-teal/30 border-2 border-deep-teal text-gray-100'
              }
              ${isHovered && showActions ? 'shadow-neon' : ''}
              transition-all duration-300
            `}
            whileHover={{ scale: 1.01 }}
          >
            <div className="text-sm leading-relaxed">
              {isTyping ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">AI assistant is typing</span>
                  <div className="flex gap-1">
                    <motion.span
                      className="w-2 h-2 bg-neon-green rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    />
                    <motion.span
                      className="w-2 h-2 bg-neon-green rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.span
                      className="w-2 h-2 bg-neon-green rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>
          </motion.div>

          {/* Action Menu */}
          <AnimatePresence>
            {isHovered && showActions && !isTyping && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`
                  absolute top-0 ${isUser ? 'right-full mr-2' : 'left-full ml-2'}
                  flex flex-col gap-1 bg-black border border-neon-green/50 rounded p-1
                  shadow-neon
                `}
                role="toolbar"
                aria-label="Message actions"
              >
                <button
                  onClick={() => onPin(message.id)}
                  className="p-2 hover:bg-neon-green/20 rounded transition-colors group focus-visible-ring"
                  aria-label={message.isPinned ? 'Unpin message' : 'Pin message'}
                  title={message.isPinned ? 'Unpin' : 'Pin'}
                >
                  <Pin 
                    className={`w-4 h-4 ${message.isPinned ? 'text-neon-green' : 'text-gray-400 group-hover:text-neon-green'}`}
                    fill={message.isPinned ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-neon-green/20 rounded transition-colors group focus-visible-ring"
                  aria-label="Copy message to clipboard"
                  title="Copy"
                >
                  <Copy className="w-4 h-4 text-gray-400 group-hover:text-neon-green" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-2 hover:bg-error-red/20 rounded transition-colors group focus-visible-ring"
                  aria-label="Delete message"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-error-red" aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Memoize the component to prevent unnecessary re-renders when message hasn't changed
export const ChatMessage = memo(ChatMessageComponent);
