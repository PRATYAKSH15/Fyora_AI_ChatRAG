import { useState, useCallback } from 'react';
import { api } from '../services/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [sources, setSources] = useState([]);

  const loadMessages = useCallback(async (threadId) => {
    try {
      const msgs = await api.getMessages(threadId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  const sendMessage = useCallback(async (message, threadId, enableWebSearch, enableRag) => {
    setIsLoading(true);
    setStatus('thinking');
    setSources([]);

    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Add placeholder for assistant message
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true
    }]);

    let threadTitle = null;

    try {
      for await (const data of api.streamChat(message, threadId, enableWebSearch, enableRag)) {
        if (data.status) {
          setStatus(data.status);
        }
        if (data.sources) {
          setSources(data.sources);
        }
        if (data.chunk) {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantId 
              ? { ...msg, content: msg.content + data.chunk }
              : msg
          ));
        }
        if (data.done) {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantId 
              ? { ...msg, isStreaming: false, sources: JSON.stringify(sources) }
              : msg
          ));
          threadTitle = data.thread_title;
        }
        if (data.error) {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantId 
          ? { ...msg, content: 'Error: Failed to get response', isStreaming: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setStatus(null);
    }

    return threadTitle;
  }, [sources]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSources([]);
  }, []);

  return {
    messages,
    isLoading,
    status,
    sources,
    sendMessage,
    loadMessages,
    clearMessages
  };
}