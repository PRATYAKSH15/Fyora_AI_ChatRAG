import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { MessageSquare } from 'lucide-react';

export function ChatArea({
  messages,
  isLoading,
  status,
  onSend,
  enableWebSearch,
  enableRag,
  onToggleWebSearch,
  onToggleRag,
  currentThread
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-primary-600/20 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-dark-100 mb-2">
              Welcome to Fyora Chat
            </h2>
            <p className="text-dark-400 max-w-md">
              Start a conversation, upload documents for context, or enable web search for real-time information.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {['Explain quantum computing', 'Write a Python script', 'Summarize a document'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSend(prompt)}
                  className="px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-sm text-dark-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSend={onSend}
        isLoading={isLoading}
        status={status}
        enableWebSearch={enableWebSearch}
        enableRag={enableRag}
        onToggleWebSearch={onToggleWebSearch}
        onToggleRag={onToggleRag}
      />
    </div>
  );
}