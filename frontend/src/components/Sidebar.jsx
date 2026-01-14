import React, { useState } from 'react';
import { 
  MessageSquarePlus, 
  MessageSquare, 
  Trash2, 
  FileText, 
  Upload, 
  X, 
  ChevronDown,
  ChevronRight,
  File,
  FileType,
  Menu
} from 'lucide-react';
import { format } from 'date-fns';

export function Sidebar({ 
  threads, 
  documents, 
  currentThread, 
  onSelectThread, 
  onNewThread, 
  onDeleteThread,
  onUploadDocument,
  onDeleteDocument,
  isOpen,
  onToggle
}) {
  const [showDocuments, setShowDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUploadDocument(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileType className="w-4 h-4 text-red-400" />;
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-800 rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-dark-900 border-r border-dark-700
        flex flex-col
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Fyora Chat
            </h1>
            <button onClick={onToggle} className="lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={onNewThread}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Threads */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {threads.map(thread => (
              <div
                key={thread.id}
                className={`
                  group flex items-center gap-2 p-3 rounded-lg cursor-pointer
                  transition-colors duration-200
                  ${currentThread?.id === thread.id 
                    ? 'bg-primary-600/20 text-primary-300' 
                    : 'hover:bg-dark-800 text-dark-200'}
                `}
                onClick={() => onSelectThread(thread)}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{thread.title}</p>
                  <p className="text-xs text-dark-400">
                    {format(new Date(thread.updated_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(thread.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Documents Section */}
        <div className="border-t border-dark-700">
          <button
            onClick={() => setShowDocuments(!showDocuments)}
            className="w-full flex items-center justify-between p-4 hover:bg-dark-800 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <FileText className="w-4 h-4" />
              Documents ({documents.length})
            </span>
            {showDocuments ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {showDocuments && (
            <div className="p-2 space-y-2 max-h-48 overflow-y-auto">
              {/* Upload button */}
              <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-dark-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              
              {/* Document list */}
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 p-2 bg-dark-800 rounded-lg group"
                >
                  {getFileIcon(doc.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{doc.filename}</p>
                    <p className="text-xs text-dark-400">{doc.chunk_count} chunks</p>
                  </div>
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}