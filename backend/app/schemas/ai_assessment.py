"""Pydantic schemas for AI Assessment Generation, Document Analysis, and Trainer Review."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class LearningMaterialResponse(BaseModel):
    """Schema for public learning material metadata. Internal server paths are omitted."""

    id: uuid.UUID
    title: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaterialAnalysisResponse(BaseModel):
    """Schema for document statistical analysis and detected subject matter."""

    material_id: uuid.UUID
    word_count: int
    character_count: int
    estimated_reading_minutes: int
    topics: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)


class GenerateQuestionsRequest(BaseModel):
    """Configuration payload to trigger AI/Mock assessment question generation."""

    material_id: uuid.UUID
    number_of_questions: int = Field(default=5, description="Allowed values: 5, 10, 15, or 20")
    difficulty: str = Field(default="MEDIUM", description="EASY, MEDIUM, HARD, or MIXED")
    question_type: str = Field(default="MCQ", description="MCQ or SCENARIO_BASED")
    competency_id: Optional[uuid.UUID] = Field(None, description="Optional target competency alignment")
    language: str = Field(default="English", description="Target language: English, Hindi, Telugu, etc.")

    @field_validator("number_of_questions")
    @classmethod
    def validate_number_of_questions(cls, v: int) -> int:
        if v not in {5, 10, 15, 20}:
            raise ValueError("number_of_questions must be one of: 5, 10, 15, or 20")
        return v

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        val = v.strip().upper()
        if val not in {"EASY", "MEDIUM", "HARD", "MIXED"}:
            raise ValueError("difficulty must be EASY, MEDIUM, HARD, or MIXED")
        return val

    @field_validator("question_type")
    @classmethod
    def validate_question_type(cls, v: str) -> str:
        val = v.strip().upper()
        if val not in {"MCQ", "SCENARIO_BASED"}:
            raise ValueError("question_type must be MCQ or SCENARIO_BASED")
        return val


class GeneratedQuestionResponse(BaseModel):
    """Schema representing an individual generated question pending or under review."""

    id: uuid.UUID
    learning_material_id: uuid.UUID
    competency_id: Optional[uuid.UUID] = None
    question_text: str
    question_type: str
    difficulty: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str] = None
    source_reference: Optional[str] = None
    generation_status: str
    validation_status: str
    generation_mode: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GeneratedQuestionsResponse(BaseModel):
    """Aggregate response returned after a question generation run."""

    material_id: uuid.UUID
    generation_mode: str
    questions: List[GeneratedQuestionResponse]
    generated_count: int
    invalid_count: int
    duplicate_warnings: List[str] = Field(default_factory=list)


class GeneratedQuestionUpdate(BaseModel):
    """Schema for trainer editing of a generated question."""

    question_text: Optional[str] = Field(None, min_length=5)
    difficulty: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    competency_id: Optional[uuid.UUID] = None

    @field_validator("correct_option")
    @classmethod
    def validate_correct_option(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            val = v.strip().upper()
            if val not in {"A", "B", "C", "D"}:
                raise ValueError("correct_option must be A, B, C, or D")
            return val
        return None


class CreateAssessmentFromApprovedRequest(BaseModel):
    """Payload to convert approved generated questions into an official Assessment catalog entry."""

    title: str = Field(..., min_length=2, max_length=200, description="Title for the created assessment")
    description: Optional[str] = Field(None, description="Overview of the assessment")
    instructions: Optional[str] = Field(None, description="Instructions for test takers")
    duration_minutes: int = Field(default=30, gt=0, description="Time limit in minutes")
    difficulty: str = Field(default="INTERMEDIATE", description="BEGINNER, INTERMEDIATE, ADVANCED, MIXED")
    generated_question_ids: List[uuid.UUID] = Field(..., min_length=1, description="List of approved question UUIDs")
