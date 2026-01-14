const API_BASE = '/api';

export const api = {
  // Threads
  async getThreads() {
    const response = await fetch(`${API_BASE}/threads/`);
    if (!response.ok) throw new Error('Failed to fetch threads');
    return response.json();
  },

  async createThread(title = 'New Conversation') {
    const response = await fetch(`${API_BASE}/threads/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!response.ok) throw new Error('Failed to create thread');
    return response.json();
  },

  async deleteThread(threadId) {
    const response = await fetch(`${API_BASE}/threads/${threadId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete thread');
    return response.json();
  },

  async getMessages(threadId) {
    const response = await fetch(`${API_BASE}/threads/${threadId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  // Chat (streaming)
  async *streamChat(message, threadId, enableWebSearch = false, enableRag = true) {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        thread_id: threadId,
        enable_web_search: enableWebSearch,
        enable_rag: enableRag
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            yield data;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  },

  // Documents
  async getDocuments() {
    const response = await fetch(`${API_BASE}/documents/`);
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload document');
    }
    return response.json();
  },

  async deleteDocument(documentId) {
    const response = await fetch(`${API_BASE}/documents/${documentId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete document');
    return response.json();
  }
};