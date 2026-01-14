import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { useChat } from './hooks/useChat';
import { api } from './services/api';

function App() {
  const [threads, setThreads] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [currentThread, setCurrentThread] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [enableRag, setEnableRag] = useState(true);

  const { 
    messages, 
    isLoading, 
    status, 
    sendMessage, 
    loadMessages, 
    clearMessages 
  } = useChat();

  // Load initial data
  useEffect(() => {
    loadThreads();
    loadDocuments();
  }, []);

  // Load threads
  const loadThreads = async () => {
    try {
      const data = await api.getThreads();
      setThreads(data);
      if (data.length > 0 && !currentThread) {
        selectThread(data[0]);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  };

  // Load documents
  const loadDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  // Select thread
  const selectThread = useCallback((thread) => {
    setCurrentThread(thread);
    loadMessages(thread.id);
    setSidebarOpen(false);
  }, [loadMessages]);

  // Create new thread
  const handleNewThread = async () => {
    try {
      const thread = await api.createThread();
      setThreads(prev => [thread, ...prev]);
      setCurrentThread(thread);
      clearMessages();
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  // Delete thread
  const handleDeleteThread = async (threadId) => {
    try {
      await api.deleteThread(threadId);
      setThreads(prev => prev.filter(t => t.id !== threadId));
      if (currentThread?.id === threadId) {
        setCurrentThread(null);
        clearMessages();
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  // Upload document
  const handleUploadDocument = async (file) => {
    try {
      const doc = await api.uploadDocument(file);
      setDocuments(prev => [doc, ...prev]);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(error.message);
    }
  };

  // Delete document
  const handleDeleteDocument = async (documentId) => {
    try {
      await api.deleteDocument(documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // Send message
  const handleSendMessage = async (message) => {
    let thread = currentThread;
    
    // Create thread if none exists
    if (!thread) {
      thread = await api.createThread();
      setThreads(prev => [thread, ...prev]);
      setCurrentThread(thread);
    }

    const newTitle = await sendMessage(message, thread.id, enableWebSearch, enableRag);
    
    // Update thread title if it changed
    if (newTitle) {
      setThreads(prev => prev.map(t => 
        t.id === thread.id ? { ...t, title: newTitle } : t
      ));
      setCurrentThread(prev => prev ? { ...prev, title: newTitle } : prev);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        threads={threads}
        documents={documents}
        currentThread={currentThread}
        onSelectThread={selectThread}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onUploadDocument={handleUploadDocument}
        onDeleteDocument={handleDeleteDocument}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-dark-700 flex items-center px-4 lg:px-6">
          <div className="pl-10 lg:pl-0">
            <h2 className="font-semibold text-dark-100 truncate">
              {currentThread?.title || 'New Conversation'}
            </h2>
          </div>
        </header>

        {/* Chat area */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          status={status}
          onSend={handleSendMessage}
          enableWebSearch={enableWebSearch}
          enableRag={enableRag}
          onToggleWebSearch={() => setEnableWebSearch(!enableWebSearch)}
          onToggleRag={() => setEnableRag(!enableRag)}
          currentThread={currentThread}
        />
      </main>
    </div>
  );
}

export default App;