"""Learning Path and Learning Path Item Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class LearningPathItemBriefCourse(BaseModel):
    """Compact course representation embedded in learning path steps."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    provider: str
    domain: str
    difficulty: str
    duration_hours: float
    url: Optional[str] = None


class LearningPathItemResponse(BaseModel):
    """Schema representing an individual step in a personalized learning path."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sequence_order: int
    course: LearningPathItemBriefCourse
    status: str
    priority: str
    reason: str
    estimated_duration_hours: float


class LearningPathItemUpdate(BaseModel):
    """Schema for updating a learning path item's progress status."""

    status: str = Field(
        ...,
        pattern="^(NOT_STARTED|IN_PROGRESS|COMPLETED|SKIPPED)$",
        description="New progress status (NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED)",
    )


class LearningPathResponse(BaseModel):
    """Schema returning complete learning path details and ordered course items."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: Optional[str] = None
    target_role: str
    estimated_duration_hours: float
    status: str
    generated_at: datetime
    items: List[LearningPathItemResponse] = []


class LearningPathGenerationResponse(BaseModel):
    """Schema returned after dynamic learning path generation."""

    learning_path: LearningPathResponse
    skill_gaps_used: int
    courses_recommended: int
    generated_at: datetime


class WatchTimeStatsResponse(BaseModel):
    """Schema returning calculated watch time and module progress metrics for a learner."""

    total_watch_hours: float
    completed_courses_count: int
    in_progress_courses_count: int
    total_courses_count: int
    completion_rate_percent: float

