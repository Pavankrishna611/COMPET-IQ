"""Chat Service managing conversations and message histories."""

import json
import logging
import re
import uuid
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.chat_conversation import ChatConversation
from app.models.chat_message import ChatMessage

logger = logging.getLogger("competiq.services.chat")


class ChatService:
    """Service handling multi-turn conversation lifecycles and message persistence."""

    @staticmethod
    def generate_conversation_title(message_text: str) -> str:
        """Derive a clean, concise conversation title from the initial user question without calling an LLM."""
        cleaned = (message_text or "").strip()
        # Remove common question openers
        prefixes = [
            r"^what\s+is\s+(?:a|an|the)?\s*",
            r"^what\s+are\s+(?:the)?\s*",
            r"^explain\s+(?:the|about)?\s*",
            r"^how\s+does\s+(?:the)?\s*",
            r"^how\s+to\s*",
            r"^can\s+you\s+explain\s*",
            r"^tell\s+me\s+about\s*",
        ]
        title = cleaned
        for p in prefixes:
            title = re.sub(p, "", title, flags=re.IGNORECASE)

        # Remove trailing question marks and punctuation
        title = re.sub(r"[\?\.\!]+$", "", title).strip()

        if not title:
            title = "Learning Conversation"
        else:
            # Capitalize words and truncate
            title = title[:45].strip()
            title = title[0].upper() + title[1:]

        return title

    @classmethod
    def create_conversation(
        cls,
        db: Session,
        user_id: uuid.UUID,
        initial_message: Optional[str] = None,
    ) -> ChatConversation:
        """Create a new chat conversation for the authenticated user."""
        title = cls.generate_conversation_title(initial_message) if initial_message else "New Conversation"
        conv = ChatConversation(
            user_id=user_id,
            title=title,
            is_active=True,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        logger.info(f"Created conversation '{conv.id}' for user {user_id}: '{conv.title}'")
        return conv

    @classmethod
    def get_user_conversations(
        cls,
        db: Session,
        user_id: uuid.UUID,
        limit: int = 50,
    ) -> List[ChatConversation]:
        """Fetch all active conversations for user sorted by most recent activity."""
        return (
            db.query(ChatConversation)
            .filter(
                ChatConversation.user_id == user_id,
                ChatConversation.is_active == True,
            )
            .order_by(ChatConversation.updated_at.desc())
            .limit(limit)
            .all()
        )

    @classmethod
    def get_conversation(
        cls,
        db: Session,
        user_id: uuid.UUID,
        conversation_id: uuid.UUID,
    ) -> ChatConversation:
        """Retrieve a specific conversation, validating ownership."""
        conv = (
            db.query(ChatConversation)
            .filter(
                ChatConversation.id == conversation_id,
                ChatConversation.is_active == True,
            )
            .first()
        )
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation '{conversation_id}' not found.",
            )
        if conv.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this conversation.",
            )
        return conv

    @classmethod
    def delete_conversation(
        cls,
        db: Session,
        user_id: uuid.UUID,
        conversation_id: uuid.UUID,
    ) -> None:
        """Soft-delete or purge a conversation owned by the caller."""
        conv = cls.get_conversation(db, user_id, conversation_id)
        db.delete(conv)
        db.commit()
        logger.info(f"Deleted conversation '{conversation_id}' for user {user_id}")

    @classmethod
    def save_message(
        cls,
        db: Session,
        conversation_id: uuid.UUID,
        role: str,
        content: str,
        sources: Optional[List[Dict[str, Any]]] = None,
    ) -> ChatMessage:
        """Save a user or assistant message to the conversation."""
        sources_json = json.dumps(sources) if sources else None
        msg = ChatMessage(
            conversation_id=conversation_id,
            role=role.upper(),
            content=content.strip(),
            sources_json=sources_json,
        )
        db.add(msg)
        # Touch conversation updated_at
        conv = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
        if conv:
            db.add(conv)
        db.commit()
        db.refresh(msg)
        return msg
