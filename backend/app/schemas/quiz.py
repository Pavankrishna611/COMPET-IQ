"""Pydantic schemas for Quiz attempts, submissions, and scoring results."""

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.assessment import AssessmentResponse, QuestionLearnerResponse


class QuestionAnswerSubmit(BaseModel):
    """Schema for submitting or saving an answer to a single question."""

    question_id: uuid.UUID
    selected_option: Optional[str] = Field(None, description="A, B, C, D or None if unanswered")

    @field_validator("selected_option")
    @classmethod
    def validate_selected_option(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            val = v.strip().upper()
            if val not in {"A", "B", "C", "D"}:
                raise ValueError("selected_option must be 'A', 'B', 'C', or 'D'")
            return val
        return None


class QuizSubmitRequest(BaseModel):
    """Schema for batch submitting quiz answers."""

    answers: Optional[List[QuestionAnswerSubmit]] = Field(default_factory=list)


class QuizStartResponse(BaseModel):
    """Payload returned when learner starts or resumes a quiz."""

    attempt_id: uuid.UUID
    assessment: AssessmentResponse
    questions: List[QuestionLearnerResponse]
    started_at: datetime


class QuizActiveResponse(BaseModel):
    """Payload for viewing an active, in-progress attempt."""

    attempt_id: uuid.UUID
    assessment: AssessmentResponse
    questions: List[QuestionLearnerResponse]
    saved_answers: Dict[str, Optional[str]] = Field(default_factory=dict)
    started_at: datetime
    duration_minutes: int
    status: str


class CompetencyScore(BaseModel):
    """Aggregated performance on questions grouped by competency."""

    competency_id: Optional[uuid.UUID] = None
    competency_name: str
    total_questions: int
    correct_answers: int
    percentage: float


class QuestionReviewItem(BaseModel):
    """Post-submission question review with correct answers, explanation, and points."""

    question_id: uuid.UUID
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    selected_option: Optional[str] = None
    correct_option: str
    is_correct: bool
    explanation: Optional[str] = None
    points_earned: float
    max_points: float
    competency_name: Optional[str] = None


class QuizResultResponse(BaseModel):
    """Comprehensive evaluation results delivered after quiz submission."""

    attempt_id: uuid.UUID
    assessment: AssessmentResponse
    score: float
    percentage: float
    correct_answers: int
    incorrect_answers: int
    total_questions: int
    time_taken_seconds: Optional[int] = None
    competency_breakdown: List[CompetencyScore] = Field(default_factory=list)
    submitted_at: datetime
    question_review: List[QuestionReviewItem] = Field(default_factory=list)


class UserAttemptHistoryItem(BaseModel):
    """Historical summary item for learner's past attempts."""

    attempt_id: uuid.UUID
    assessment_id: uuid.UUID
    assessment_title: str
    status: str
    score: float
    percentage: float
    started_at: datetime
    submitted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
