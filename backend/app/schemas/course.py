"""Course, CourseCompetency, and CoursePrerequisite Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


# -----------------------------------------------------------------------------
# Course Competency Schemas
# -----------------------------------------------------------------------------
class CourseCompetencyCreate(BaseModel):
    """Schema for associating a competency with a course."""

    competency_id: uuid.UUID = Field(..., description="UUID of the improved competency")
    expected_improvement: float = Field(..., gt=0.0, description="Expected proficiency gain (must be positive)")


class CourseCompetencyResponse(BaseModel):
    """Schema returning course competency association details."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    competency_id: uuid.UUID
    competency_name: str
    expected_improvement: float

    @model_validator(mode="before")
    @classmethod
    def extract_competency_name(cls, data: Any) -> Any:
        if hasattr(data, "competency") and data.competency:
            return {
                "id": data.id,
                "competency_id": data.competency_id,
                "competency_name": data.competency.name,
                "expected_improvement": data.expected_improvement,
            }
        return data


# -----------------------------------------------------------------------------
# Course Prerequisite Schemas
# -----------------------------------------------------------------------------
class CoursePrerequisiteCreate(BaseModel):
    """Schema for adding a prerequisite dependency to a course."""

    prerequisite_course_id: uuid.UUID = Field(..., description="UUID of the course that must be completed first")


class CoursePrerequisiteResponse(BaseModel):
    """Schema returning prerequisite relationship information."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    prerequisite_course_id: uuid.UUID
    prerequisite_title: str

    @model_validator(mode="before")
    @classmethod
    def extract_prerequisite_title(cls, data: Any) -> Any:
        if hasattr(data, "prerequisite_course") and data.prerequisite_course:
            return {
                "id": data.id,
                "prerequisite_course_id": data.prerequisite_course_id,
                "prerequisite_title": data.prerequisite_course.title,
            }
        return data


# -----------------------------------------------------------------------------
# Core Course Schemas
# -----------------------------------------------------------------------------
class CourseCreate(BaseModel):
    """Schema for registering a new learning course in the catalog."""

    title: str = Field(..., min_length=1, max_length=255, description="Course title")
    description: Optional[str] = Field(None, description="Course description")
    provider: str = Field(..., min_length=1, max_length=100, description="Provider (e.g. iGOT Karmayogi, NSSTA)")
    domain: str = Field(..., min_length=1, max_length=100, description="Knowledge domain")
    difficulty: str = Field("Beginner", description="Difficulty level (Beginner, Intermediate, Advanced)")
    duration_hours: float = Field(0.0, ge=0.0, description="Estimated duration in hours")
    url: Optional[str] = Field(None, max_length=500, description="Direct URL to learning material")
    is_active: bool = Field(True, description="Whether the course is currently active and available")


class CourseUpdate(BaseModel):
    """Schema for modifying existing course information."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    provider: Optional[str] = Field(None, min_length=1, max_length=100)
    domain: Optional[str] = Field(None, min_length=1, max_length=100)
    difficulty: Optional[str] = None
    duration_hours: Optional[float] = Field(None, ge=0.0)
    url: Optional[str] = None
    is_active: Optional[bool] = None


class CourseResponse(BaseModel):
    """Schema for returning course details including competencies and prerequisites."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: Optional[str] = None
    provider: str
    domain: str
    difficulty: str
    duration_hours: float
    url: Optional[str] = None
    is_active: bool
    competencies: List[CourseCompetencyResponse] = []
    prerequisites: List[CoursePrerequisiteResponse] = []
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def extract_relations(cls, data: Any) -> Any:
        if hasattr(data, "course_competencies") or hasattr(data, "prerequisites"):
            return {
                "id": data.id,
                "title": data.title,
                "description": data.description,
                "provider": data.provider,
                "domain": data.domain,
                "difficulty": data.difficulty,
                "duration_hours": data.duration_hours,
                "url": data.url,
                "is_active": data.is_active,
                "competencies": getattr(data, "course_competencies", []),
                "prerequisites": getattr(data, "prerequisites", []),
                "created_at": data.created_at,
                "updated_at": data.updated_at,
            }
        return data
