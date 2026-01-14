from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    groq_api_key: str = ""
    openai_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///./chat.db"
    chroma_persist_dir: str = "./chroma_db"
    upload_dir: str = "./uploads"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

# Create directories if they don't exist
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.chroma_persist_dir, exist_ok=True)