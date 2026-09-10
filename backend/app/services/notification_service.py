"""Notification Service.

Handles persistent notifications for learners, trainers, and admins.
"""

import logging
import uuid
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationResponse, NotificationSummaryResponse

logger = logging.getLogger("competiq.services.notification")


class NotificationService:
    """Service handling CRUD operations and user status for system notifications."""

    @staticmethod
    def create_notification(
        db: Session,
        notification_in: NotificationCreate,
    ) -> Notification:
        """Create and persist a new notification."""
        notif = Notification(
            user_id=notification_in.user_id,
            title=notification_in.title,
            message=notification_in.message,
            type=notification_in.type,
            target_role=notification_in.target_role,
            action_url=notification_in.action_url,
            reference_id=notification_in.reference_id,
            is_read=False,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        logger.info("Notification created for user %s: %s", notif.user_id, notif.title)
        return notif

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: uuid.UUID,
        limit: int = 50,
    ) -> NotificationSummaryResponse:
        """Fetch all notifications for a specific user, including unread count."""
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        total_count = query.count()
        unread_count = query.filter(Notification.is_read == False).count()  # noqa: E712
        
        items = query.order_by(desc(Notification.created_at)).limit(limit).all()
        
        return NotificationSummaryResponse(
            unread_count=unread_count,
            total_count=total_count,
            items=[NotificationResponse.model_validate(item) for item in items],
        )

    @staticmethod
    def mark_as_read(
        db: Session,
        notification_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> NotificationResponse:
        """Mark a specific notification as read by the owner."""
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notif:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )
        if notif.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this notification",
            )
        notif.is_read = True
        db.commit()
        db.refresh(notif)
        return NotificationResponse.model_validate(notif)

    @staticmethod
    def mark_all_as_read(
        db: Session,
        user_id: uuid.UUID,
    ) -> int:
        """Mark all unread notifications for a user as read."""
        updated = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
            .update({"is_read": True}, synchronize_session=False)
        )
        db.commit()
        return updated
