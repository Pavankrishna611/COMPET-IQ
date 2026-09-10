"""Notifications API Router.

Provides endpoints for users to retrieve and manage persistent notifications.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.notification import NotificationResponse, NotificationSummaryResponse
from app.services.notification_service import NotificationService

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.get(
    "",
    response_model=NotificationSummaryResponse,
    summary="Get User Notifications",
    description="Retrieve all persistent notifications and unread count for the authenticated user.",
)
def get_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationSummaryResponse:
    """Retrieve notifications for the current authenticated user."""
    return NotificationService.get_user_notifications(db=db, user_id=current_user.id, limit=limit)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark Notification as Read",
    description="Mark a single notification as read by id.",
)
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationResponse:
    """Mark a notification as read."""
    return NotificationService.mark_as_read(db=db, notification_id=notification_id, user_id=current_user.id)


@router.post(
    "/mark-all-read",
    response_model=MessageResponse,
    summary="Mark All Notifications as Read",
    description="Mark all unread notifications for current user as read.",
)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Mark all notifications for the user as read."""
    updated = NotificationService.mark_all_as_read(db=db, user_id=current_user.id)
    return MessageResponse(message=f"Marked {updated} notifications as read.")
