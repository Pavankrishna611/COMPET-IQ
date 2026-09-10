"""Application Configuration module using Pydantic Settings."""

from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Core application settings loaded from environment variables or defaults."""

    APP_NAME: str = "COMPETIQ API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./competiq.db"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://*.railway.app,https://*.up.railway.app"

    # JWT Authentication & Security
    SECRET_KEY: str = "replace_with_secure_random_secret_key_development_32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Document Upload & Processing Settings
    UPLOAD_DIR: str = "uploads/learning_materials"
    MAX_UPLOAD_SIZE_MB: int = 20
    ALLOWED_DOCUMENT_TYPES: str = "pdf,docx,pptx,txt"

    # LLM & RAG Settings
    LLM_PROVIDER: Optional[str] = None
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: Optional[str] = None
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    CHROMA_PERSIST_DIRECTORY: str = "vector_store"
    RAG_TOP_K: int = 5
    RAG_MIN_SIMILARITY: float = 0.35
    RAG_MAX_CONTEXT_CHARS: int = 12000

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: Optional[str]) -> str:
        if not v:
            return "sqlite:///./competiq.db"
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        if len(v) < 16:
            raise ValueError("SECRET_KEY must be at least 16 characters long for secure JWT signing.")
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
