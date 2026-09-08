"""AI Learning Assistant Chat API Router."""

import json
import logging
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.assistant import (
    AssistantResponse,
    ChatMessageResponse,
    ChatRequest,
    ConversationDetailResponse,
    ConversationResponse,
    SourceReference,
)
from app.services.chat_service import ChatService
from app.services.rag_service import RAGService

logger = logging.getLogger("competiq.api.assistant")

router = APIRouter(prefix="/assistant", tags=["AI Learning Assistant"])


@router.post(
    "/chat",
    response_model=AssistantResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask Question to AI Learning Assistant",
    description="Submit an educational question to the RAG AI Learning Assistant. Returns a grounded answer cited with approved learning materials.",
)
def chat_with_assistant(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssistantResponse:
    """Ask a question and receive a grounded, competency-aware response."""
    cleaned = payload.message.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat message cannot be empty or solely whitespace.",
        )

    response_dict = RAGService.answer_question(
        db=db,
        user=current_user,
        question=cleaned,
        conversation_id=payload.conversation_id,
    )

    return AssistantResponse(**response_dict)


@router.get(
    "/conversations",
    response_model=List[ConversationResponse],
    summary="List My Chat Conversations",
    description="Retrieve active chat conversations for the authenticated learner, ordered by most recent activity.",
)
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[ConversationResponse]:
    """List caller's conversations."""
    return ChatService.get_user_conversations(db=db, user_id=current_user.id)


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailResponse,
    summary="Get Conversation History",
    description="Fetch a conversation and its complete chronological message history with cited sources.",
)
def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationDetailResponse:
    """Retrieve full conversation transcript."""
    conv = ChatService.get_conversation(db=db, user_id=current_user.id, conversation_id=conversation_id)

    formatted_messages = []
    for msg in conv.messages:
        sources_list = None
        if msg.sources_json:
            try:
                raw_sources = json.loads(msg.sources_json)
                sources_list = [
                    SourceReference(
                        material_id=s.get("material_id"),
                        material_title=s.get("material_title", ""),
                        chunk_index=s.get("chunk_index", 0),
                        relevance_score=s.get("relevance_score", 0.0),
                        snippet=s.get("snippet"),
                    )
                    for s in raw_sources
                ]
            except Exception:
                sources_list = None

        formatted_messages.append(
            ChatMessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                sources=sources_list,
                created_at=msg.created_at,
            )
        )

    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        is_active=conv.is_active,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=formatted_messages,
    )


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Chat Conversation",
    description="Delete a conversation and all its messages. Owner only.",
)
def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Purge a conversation owned by the authenticated caller."""
    ChatService.delete_conversation(db=db, user_id=current_user.id, conversation_id=conversation_id)
    return {"message": f"Conversation '{conversation_id}' successfully deleted."}
