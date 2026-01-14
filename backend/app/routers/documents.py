from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import os
import uuid
from app.database import get_db
from app.models import Document
from app.schemas import DocumentResponse
from app.config import settings
from app.services.rag_service import rag_service
from app.utils.document_processor import process_document, get_file_type

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # Validate file type
    file_type = get_file_type(file.filename)
    if file_type == "unknown":
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: PDF, DOCX, TXT, MD"
        )
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(settings.upload_dir, f"{file_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create document record
    document = Document(
        id=file_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        processed=False
    )
    db.add(document)
    
    try:
        # Process document
        text, _ = await process_document(file_path, file_type)
        
        # Add to vector store
        chunk_count = await rag_service.add_documents(
            text=text,
            metadata={
                "document_id": file_id,
                "filename": file.filename,
                "file_type": file_type
            }
        )
        
        document.chunk_count = chunk_count
        document.processed = True
        await db.commit()
        await db.refresh(document)
        
    except Exception as e:
        await db.rollback()
        # Clean up file
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    
    return document

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).order_by(Document.uploaded_at.desc())
    )
    return result.scalars().all()

@router.delete("/{document_id}")
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from vector store
    await rag_service.delete_document(document_id)
    
    # Delete file
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Delete record
    await db.delete(document)
    await db.commit()
    
    return {"message": "Document deleted successfully"}