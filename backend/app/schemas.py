from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Thread Schemas
class ThreadCreate(BaseModel):
    title: Optional[str] = "New Conversation"

class ThreadResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ThreadUpdate(BaseModel):
    title: str

# Message Schemas
class MessageCreate(BaseModel):
    content: str
    enable_web_search: bool = False
    enable_rag: bool = True

class MessageResponse(BaseModel):
    id: str
    thread_id: str
    role: str
    content: str
    sources: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    thread_id: str
    enable_web_search: bool = False
    enable_rag: bool = True

class ChatResponse(BaseModel):
    message: str
    sources: List[dict] = []
    thread_id: str

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    chunk_count: int
    uploaded_at: datetime
    processed: bool
    
    class Config:
        from_attributes = True