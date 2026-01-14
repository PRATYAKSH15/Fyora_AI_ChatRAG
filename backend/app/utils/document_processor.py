import os
from pypdf import PdfReader
from docx import Document as DocxDocument
from typing import Tuple

async def process_document(file_path: str, file_type: str) -> Tuple[str, int]:
    """Extract text from various document formats"""
    text = ""
    
    try:
        if file_type == "pdf":
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() or ""
        
        elif file_type == "docx":
            doc = DocxDocument(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        
        elif file_type in ["txt", "md"]:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        return text.strip(), len(text)
    
    except Exception as e:
        raise Exception(f"Error processing document: {str(e)}")

def get_file_type(filename: str) -> str:
    """Get file type from filename"""
    ext = filename.lower().split(".")[-1]
    type_map = {
        "pdf": "pdf",
        "docx": "docx",
        "doc": "docx",
        "txt": "txt",
        "md": "md"
    }
    return type_map.get(ext, "unknown")