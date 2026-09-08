"""Course Recommendation Pydantic schemas."""

import uuid
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class CourseRecommendationResponse(BaseModel):
    """Schema representing an explainable, ranked course recommendation item."""

    model_config = ConfigDict(from_attributes=True)

    course_id: uuid.UUID
    course_title: str
    provider: str
    difficulty: str
    duration_hours: float
    recommendation_score: int = Field(..., ge=0, le=100, description="Recommendation score between 0 and 100")
    priority: str = Field(..., description="Priority based on addressed gap severity (CRITICAL, HIGH, MODERATE, LOW)")
    matching_competencies: List[str] = Field(..., description="Names of competencies improved by this course")
    reason: str = Field(..., description="Explainable deterministic justification for recommendation")
