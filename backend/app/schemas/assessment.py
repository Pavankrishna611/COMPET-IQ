"""Pydantic schemas for Assessments and Questions."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AssessmentBase(BaseModel):
    """Base schema for assessments."""

    title: str = Field(..., min_length=2, max_length=200, description="Title of assessment")
    description: Optional[str] = Field(None, description="Detailed overview of assessment purpose")
    instructions: Optional[str] = Field(None, description="Instructions provided to test takers")
    duration_minutes: int = Field(default=30, gt=0, description="Time limit in minutes")
    difficulty: str = Field(default="BEGINNER", description="BEGINNER, INTERMEDIATE, ADVANCED, MIXED")


class AssessmentCreate(AssessmentBase):
    """Schema for creating a new assessment (defaults to DRAFT)."""

    pass


class AssessmentUpdate(BaseModel):
    """Schema for updating assessment attributes."""

    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    difficulty: Optional[str] = None
    status: Optional[str] = Field(None, description="DRAFT, PUBLISHED, ARCHIVED")


class AssessmentResponse(AssessmentBase):
    """Schema for public/summary assessment representation."""

    id: uuid.UUID
    status: str
    question_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuestionBase(BaseModel):
    """Base schema for question definitions."""

    competency_id: Optional[uuid.UUID] = Field(None, description="Target competency assessed by this question")
    question_text: str = Field(..., min_length=5, description="Full question statement or scenario")
    question_type: str = Field(default="MCQ", description="MCQ or SCENARIO_BASED")
    difficulty: str = Field(default="MEDIUM", description="EASY, MEDIUM, or HARD")
    option_a: str = Field(..., min_length=1, description="Option A")
    option_b: str = Field(..., min_length=1, description="Option B")
    option_c: str = Field(..., min_length=1, description="Option C")
    option_d: str = Field(..., min_length=1, description="Option D")
    points: float = Field(default=1.0, gt=0.0, description="Points awarded for correct answer")
    sequence_order: int = Field(default=1, description="Ordering in assessment")


class QuestionCreate(QuestionBase):
    """Schema for creating a question with correct option and explanation."""

    correct_option: str = Field(..., description="A, B, C, or D")
    explanation: Optional[str] = Field(None, description="Educational explanation displayed after submission")

    @field_validator("correct_option")
    @classmethod
    def validate_correct_option(cls, v: str) -> str:
        val = v.strip().upper()
        if val not in {"A", "B", "C", "D"}:
            raise ValueError("correct_option must be 'A', 'B', 'C', or 'D'")
        return val


class QuestionUpdate(BaseModel):
    """Schema for editing an existing question."""

    competency_id: Optional[uuid.UUID] = None
    question_text: Optional[str] = Field(None, min_length=5)
    question_type: Optional[str] = None
    difficulty: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    points: Optional[float] = Field(None, gt=0.0)
    sequence_order: Optional[int] = None

    @field_validator("correct_option")
    @classmethod
    def validate_correct_option(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            val = v.strip().upper()
            if val not in {"A", "B", "C", "D"}:
                raise ValueError("correct_option must be 'A', 'B', 'C', or 'D'")
            return val
        return v


class QuestionLearnerResponse(QuestionBase):
    """Learner-safe question schema with correct answer and explanation strictly stripped."""

    id: uuid.UUID
    assessment_id: uuid.UUID
    competency_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class QuestionAdminResponse(QuestionBase):
    """Full question schema for Trainers and Administrators."""

    id: uuid.UUID
    assessment_id: uuid.UUID
    correct_option: str
    explanation: Optional[str] = None
    competency_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentDetailResponse(AssessmentResponse):
    """Detailed assessment response including questions."""

    questions: List[Any] = Field(default_factory=list)


class AssessmentAnalyticsResponse(BaseModel):
    """Summary analytics response for trainer/admin view."""

    assessment_id: uuid.UUID
    assessment_title: str
    total_attempts: int
    average_score: float
    average_percentage: float
    highest_score: float
    lowest_score: float
    competency_performance: List[Dict[str, Any]] = Field(default_factory=list)
