from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List
from app.database import get_db
from app.models import Thread, Message
from app.schemas import ThreadCreate, ThreadResponse, ThreadUpdate

router = APIRouter(prefix="/threads", tags=["threads"])

@router.post("/", response_model=ThreadResponse)
async def create_thread(
    thread_data: ThreadCreate = None,
    db: AsyncSession = Depends(get_db)
):
    thread = Thread(title=thread_data.title if thread_data else "New Conversation")
    db.add(thread)
    await db.commit()
    await db.refresh(thread)
    return thread

@router.get("/", response_model=List[ThreadResponse])
async def get_threads(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Thread).order_by(Thread.updated_at.desc())
    )
    return result.scalars().all()

@router.get("/{thread_id}", response_model=ThreadResponse)
async def get_thread(thread_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Thread).where(Thread.id == thread_id)
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    return thread

@router.get("/{thread_id}/messages")
async def get_thread_messages(thread_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Message)
        .where(Message.thread_id == thread_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return [
        {
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "sources": msg.sources,
            "created_at": msg.created_at.isoformat()
        }
        for msg in messages
    ]

@router.put("/{thread_id}", response_model=ThreadResponse)
async def update_thread(
    thread_id: str,
    thread_data: ThreadUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Thread).where(Thread.id == thread_id)
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    thread.title = thread_data.title
    await db.commit()
    await db.refresh(thread)
    return thread

@router.delete("/{thread_id}")
async def delete_thread(thread_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Thread).where(Thread.id == thread_id)
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    await db.delete(thread)
    await db.commit()
    return {"message": "Thread deleted successfully"}