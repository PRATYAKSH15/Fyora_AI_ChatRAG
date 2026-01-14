from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.config import settings
from typing import List, Dict
import os

class RAGService:
    def __init__(self):
        # Use HuggingFace embeddings (free) or OpenAI
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
        except:
            self.embeddings = OpenAIEmbeddings(api_key=settings.openai_api_key)
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        
        self.vectorstore = None
        self._init_vectorstore()
    
    def _init_vectorstore(self):
        try:
            self.vectorstore = Chroma(
                persist_directory=settings.chroma_persist_dir,
                embedding_function=self.embeddings,
                collection_name="documents"
            )
        except Exception as e:
            print(f"Error initializing vectorstore: {e}")
    
    async def add_documents(self, text: str, metadata: Dict) -> int:
        """Add document chunks to the vector store"""
        chunks = self.text_splitter.split_text(text)
        
        documents = [
            Document(
                page_content=chunk,
                metadata={**metadata, "chunk_index": i}
            )
            for i, chunk in enumerate(chunks)
        ]
        
        if documents:
            self.vectorstore.add_documents(documents)
        
        return len(chunks)
    
    async def search(self, query: str, k: int = 3) -> List[Dict]:
        """Search for relevant documents"""
        if not self.vectorstore:
            return []
        
        try:
            results = self.vectorstore.similarity_search_with_score(query, k=k)
            
            return [
                {
                    "content": doc.page_content,
                    "source": doc.metadata.get("filename", "Unknown"),
                    "score": float(score),
                    "metadata": doc.metadata
                }
                for doc, score in results
            ]
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    async def delete_document(self, document_id: str):
        """Delete document from vector store"""
        if self.vectorstore:
            try:
                self.vectorstore.delete(where={"document_id": document_id})
            except Exception as e:
                print(f"Delete error: {e}")

rag_service = RAGService()