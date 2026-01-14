import React, { useState, useRef, useEffect } from 'react';
import { Send, Globe, Database, Loader2 } from 'lucide-react';

export function ChatInput({ 
  onSend, 
  isLoading, 
  status,
  enableWebSearch,
  enableRag,
  onToggleWebSearch,
  onToggleRag
}) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'thinking': return 'Thinking...';
      case 'retrieving': return 'Retrieving documents...';
      case 'searching': return 'Searching the web...';
      case 'generating': return 'Generating response...';
      default: return null;
    }
  };

  return (
    <div className="border-t border-dark-700 bg-dark-900/80 backdrop-blur-sm p-4">
      {/* Status indicator */}
      {status && (
        <div className="flex items-center gap-2 mb-3 text-sm text-primary-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{getStatusText()}</span>
        </div>
      )}

      {/* Toggle buttons */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onToggleRag}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
            ${enableRag 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-dark-800 text-dark-400 border border-dark-600'}
          `}
        >
          <Database className="w-3.5 h-3.5" />
          RAG
        </button>
        <button
          onClick={onToggleWebSearch}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
            ${enableWebSearch 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-dark-800 text-dark-400 border border-dark-600'}
          `}
        >
          <Globe className="w-3.5 h-3.5" />
          Web Search
        </button>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={isLoading}
            rows={1}
            className="w-full input-field resize-none pr-4 min-h-11 max-h-50"
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className={`
            flex-shrink-0 p-3 rounded-lg transition-all duration-200
            ${message.trim() && !isLoading
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-dark-700 text-dark-500 cursor-not-allowed'}
          `}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}