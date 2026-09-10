"""Pydantic schemas for Notifications."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class NotificationBase(BaseModel):
    """Base schema for notifications."""

    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(...)
    type: str = Field(default="info", description="info, success, warning, alert, assessment")
    target_role: Optional[str] = Field(None, description="Optional target role filter")
    action_url: Optional[str] = Field(None, max_length=500)
    reference_id: Optional[str] = Field(None, max_length=100)


class NotificationCreate(NotificationBase):
    """Schema for creating a notification."""

    user_id: Optional[uuid.UUID] = None


class NotificationResponse(NotificationBase):
    """Schema for returning a notification."""

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    is_read: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationSummaryResponse(BaseModel):
    """Schema for notification list and unread count."""

    unread_count: int
    total_count: int
    items: List[NotificationResponse]
