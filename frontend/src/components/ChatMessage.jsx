import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, ExternalLink, FileText, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

export function ChatMessage({ message }) {
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const isUser = message.role === 'user';
  const sources = message.sources ? JSON.parse(message.sources) : [];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser ? 'bg-primary-600' : 'bg-dark-700'}
      `}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : ''}`}>
        <div className={`
          inline-block p-4 rounded-2xl
          ${isUser 
            ? 'bg-primary-600 text-white rounded-tr-sm' 
            : 'bg-dark-800 text-dark-100 rounded-tl-sm'}
        `}>
          <div className={`markdown-content ${isUser ? 'text-white' : ''}`}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          
          {/* Streaming indicator */}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary-400 animate-pulse ml-1" />
          )}
        </div>

        {/* Message meta */}
        <div className={`flex items-center gap-2 mt-1 text-xs text-dark-400 ${isUser ? 'justify-end' : ''}`}>
          <span>{format(new Date(message.created_at), 'h:mm a')}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-dark-700 rounded transition-colors"
              title="Copy message"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Sources */}
        {sources.length > 0 && !isUser && (
          <div className="mt-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {sources.length} source{sources.length !== 1 ? 's' : ''} used
            </button>
            
            {showSources && (
              <div className="mt-2 space-y-2">
                {sources.map((source, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2 p-2 bg-dark-800/50 rounded-lg text-sm"
                  >
                    {source.type === 'web' ? (
                      <ExternalLink className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <FileText className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-dark-200 truncate">
                        {source.title || source.source}
                      </p>
                      {source.url && (
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary-400 hover:underline truncate block"
                        >
                          {source.url}
                        </a>
                      )}
                      <p className="text-xs text-dark-400 mt-1 line-clamp-2">
                        {source.snippet || source.content?.slice(0, 150)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}