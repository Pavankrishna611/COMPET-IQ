"""Course Recommendation Pydantic schemas."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CourseRecommendationResponse(BaseModel):
    """Schema representing an explainable, ranked course recommendation item."""

    model_config = ConfigDict(from_attributes=True)

    course_id: uuid.UUID
    course_title: str
    provider: str
    difficulty: str
    duration_hours: float
    domain: Optional[str] = None
    recommendation_score: int = Field(..., ge=0, le=100, description="Recommendation score between 0 and 100")
    priority: str = Field(..., description="Priority based on addressed gap severity (CRITICAL, HIGH, MODERATE, LOW)")
    matching_competencies: List[str] = Field(..., description="Names of competencies improved by this course")
    reason: str = Field(..., description="Explainable deterministic justification for recommendation")
    is_interested: bool = Field(False, description="Whether the learner has marked this course as interested")
    is_in_learning_path: bool = Field(False, description="Whether this course is in the learner's active learning path")


class InterestedCourseResponse(BaseModel):
    """Schema representing a course marked as interested by the learner."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    course_id: uuid.UUID
    course_title: str
    provider: str
    difficulty: str
    duration_hours: float
    domain: Optional[str] = None
    marked_at: datetime
    is_in_learning_path: bool = False
