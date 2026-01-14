from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sse_starlette.sse import EventSourceResponse
from typing import AsyncGenerator
import json
from app.database import get_db
from app.models import Thread, Message
from app.schemas import ChatRequest
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service
from app.services.search_service import search_service

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    # Get thread
    result = await db.execute(
        select(Thread).where(Thread.id == request.thread_id)
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Get chat history
    result = await db.execute(
        select(Message)
        .where(Message.thread_id == request.thread_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    chat_history = [{"role": m.role, "content": m.content} for m in messages]
    
    # Gather context
    rag_context = []
    web_context = []
    sources = []
    
    if request.enable_rag:
        rag_context = await rag_service.search(request.message)
        sources.extend([{"type": "document", **r} for r in rag_context])
    
    if request.enable_web_search:
        web_context = await search_service.search(request.message)
        sources.extend([{"type": "web", **r} for r in web_context])
    
    # Save user message
    user_message = Message(
        thread_id=request.thread_id,
        role="user",
        content=request.message
    )
    db.add(user_message)
    
    # Generate response
    response = await llm_service.generate_response(
        message=request.message,
        chat_history=chat_history,
        rag_context=rag_context,
        web_context=web_context
    )
    
    # Save assistant message
    assistant_message = Message(
        thread_id=request.thread_id,
        role="assistant",
        content=response,
        sources=json.dumps(sources) if sources else None
    )
    db.add(assistant_message)
    
    # Update thread title if first message
    if len(messages) == 0:
        thread.title = await llm_service.generate_title(request.message)
    
    await db.commit()
    
    return {
        "message": response,
        "sources": sources,
        "thread_id": request.thread_id
    }

@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    async def event_generator() -> AsyncGenerator[str, None]:
        # Get thread
        result = await db.execute(
            select(Thread).where(Thread.id == request.thread_id)
        )
        thread = result.scalar_one_or_none()
        if not thread:
            yield f"data: {json.dumps({'error': 'Thread not found'})}\n\n"
            return
        
        # Get chat history
        result = await db.execute(
            select(Message)
            .where(Message.thread_id == request.thread_id)
            .order_by(Message.created_at)
        )
        messages = result.scalars().all()
        chat_history = [{"role": m.role, "content": m.content} for m in messages]
        
        # Gather context
        rag_context = []
        web_context = []
        sources = []
        
        # Send status updates
        yield f"data: {json.dumps({'status': 'thinking'})}\n\n"
        
        if request.enable_rag:
            yield f"data: {json.dumps({'status': 'retrieving'})}\n\n"
            rag_context = await rag_service.search(request.message)
            sources.extend([{"type": "document", **r} for r in rag_context])
        
        if request.enable_web_search:
            yield f"data: {json.dumps({'status': 'searching'})}\n\n"
            web_context = await search_service.search(request.message)
            sources.extend([{"type": "web", **r} for r in web_context])
        
        # Send sources
        if sources:
            yield f"data: {json.dumps({'sources': sources})}\n\n"
        
        # Save user message
        user_message = Message(
            thread_id=request.thread_id,
            role="user",
            content=request.message
        )
        db.add(user_message)
        
        # Stream response
        yield f"data: {json.dumps({'status': 'generating'})}\n\n"
        
        full_response = ""
        async for chunk in llm_service.generate_stream(
            message=request.message,
            chat_history=chat_history,
            rag_context=rag_context,
            web_context=web_context
        ):
            full_response += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        
        # Save assistant message
        assistant_message = Message(
            thread_id=request.thread_id,
            role="assistant",
            content=full_response,
            sources=json.dumps(sources) if sources else None
        )
        db.add(assistant_message)
        
        # Update thread title if first message
        if len(messages) == 0:
            thread.title = await llm_service.generate_title(request.message)
        
        await db.commit()
        
        yield f"data: {json.dumps({'done': True, 'thread_title': thread.title})}\n\n"
    
    return EventSourceResponse(event_generator())