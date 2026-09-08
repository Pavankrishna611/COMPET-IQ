"""Pydantic schemas for RAG AI Learning Assistant, Chat, and Knowledge Indexing."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SourceReference(BaseModel):
    """Source reference citation pointing to an approved document chunk."""

    material_id: uuid.UUID
    material_title: str
    chunk_index: int
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Cosine similarity score (0.0 - 1.0)")
    snippet: Optional[str] = Field(None, description="Exemplar excerpt snippet")


class ChatRequest(BaseModel):
    """Payload to query the AI Learning Assistant."""

    message: str = Field(..., min_length=1, max_length=2000, description="Learner's educational question")
    conversation_id: Optional[uuid.UUID] = Field(None, description="Optional active conversation UUID")


class AssistantResponse(BaseModel):
    """Structured response from the RAG AI Learning Assistant."""

    conversation_id: uuid.UUID
    message_id: uuid.UUID
    answer: str
    sources: List[SourceReference] = Field(default_factory=list)
    confidence: str = Field(..., description="HIGH, MEDIUM, or LOW confidence")
    suggested_followups: List[str] = Field(default_factory=list, description="Up to 4 deterministic follow-up learning prompts")
    generation_mode: str = Field(..., description="RAG_LLM or RETRIEVAL_ONLY")


class ConversationResponse(BaseModel):
    """Summary of a chat conversation."""

    id: uuid.UUID
    title: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatMessageResponse(BaseModel):
    """Single message in a conversation trajectory."""

    id: uuid.UUID
    role: str
    content: str
    sources: Optional[List[SourceReference]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailResponse(BaseModel):
    """Detailed conversation representation including chronological message history."""

    id: uuid.UUID
    title: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class MaterialIndexResponse(BaseModel):
    """Response returned upon indexing or re-indexing an approved learning material."""

    material_id: uuid.UUID
    material_title: str
    chunks_created: int
    vectors_stored: int
    status: str
    collection_name: str


class MaterialIndexStatusResponse(BaseModel):
    """Current approval and vector indexing state of a learning material."""

    material_id: uuid.UUID
    title: str
    status: str
    is_approved: bool
    is_indexed: bool
    chunk_count: int
    vector_count: int
