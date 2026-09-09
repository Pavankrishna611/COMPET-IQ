"""Pydantic schemas for AI Assessment Generation, Document Analysis, and Trainer Review."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator


class LearningMaterialResponse(BaseModel):
    """Schema for public learning material metadata. Internal server paths are omitted."""

    id: uuid.UUID
    title: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    created_at: datetime
    has_extracted_text: Optional[bool] = None
    word_count: Optional[int] = None
    extraction_error: Optional[str] = None
    material_type: Optional[str] = "LEARNER_PRACTICE"

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


class PracticeQuizGenerateRequest(BaseModel):
    """Configuration payload for learner practice quiz generation from material."""

    number_of_questions: int = Field(default=5, description="Allowed values: 5, 10, or 15")
    difficulty: str = Field(default="MEDIUM", description="EASY, MEDIUM, HARD, or MIXED")
    question_type: str = Field(default="MCQ", description="MCQ or SCENARIO_BASED")
    language: str = Field(default="English", description="Target language: English, Hindi, etc.")

    @field_validator("number_of_questions")
    @classmethod
    def validate_number_of_questions(cls, v: int) -> int:
        if v not in {5, 10, 15}:
            raise ValueError("number_of_questions must be one of: 5, 10, or 15")
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


class TrainerAssessmentGenerateRequest(BaseModel):
    """Configuration payload for trainer AI assessment generation from ready material."""

    number_of_questions: int = Field(default=5, description="Allowed values: 5, 10, or 15")
    difficulty: str = Field(default="MEDIUM", description="EASY, MEDIUM, HARD, or MIXED")
    title: Optional[str] = Field(None, description="Optional custom title for the generated draft assessment")
    competency_id: Optional[uuid.UUID] = Field(None, description="Optional competency association")

    @field_validator("number_of_questions")
    @classmethod
    def validate_number_of_questions(cls, v: int) -> int:
        if v not in {5, 10, 15}:
            raise ValueError("number_of_questions must be one of: 5, 10, or 15")
        return v

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        val = v.strip().upper()
        if val not in {"EASY", "MEDIUM", "HARD", "MIXED"}:
            raise ValueError("difficulty must be EASY, MEDIUM, HARD, or MIXED")
        return val


class TrainerGeneratedQuestionPreview(BaseModel):
    """Question item schema for trainer draft assessment preview."""

    id: uuid.UUID
    sequence_order: int
    question_text: str
    question_type: str = "MCQ"
    difficulty: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str] = None
    topic: Optional[str] = None
    source_reference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TrainerAssessmentDraftResponse(BaseModel):
    """Draft assessment preview schema for trainer review."""

    assessment_id: uuid.UUID
    title: str
    description: Optional[str] = None
    material_id: uuid.UUID
    material_title: str
    status: str = "DRAFT"
    assessment_type: str = "TRAINER_OFFICIAL"
    is_published: bool = False
    difficulty: str
    number_of_questions: int
    generation_mode: str
    is_mock_fallback: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    questions: List[TrainerGeneratedQuestionPreview]

    model_config = ConfigDict(from_attributes=True)


class TrainerDraftQuestionUpdate(BaseModel):
    """Schema for trainer updating or adding a question in a draft assessment."""

    id: Optional[uuid.UUID] = None
    sequence_order: Optional[int] = 1
    question_text: str = Field(..., min_length=3, description="Question statement or stem")
    question_type: str = "MCQ"
    difficulty: str = "MEDIUM"
    option_a: str = Field(..., min_length=1, description="Option A")
    option_b: str = Field(..., min_length=1, description="Option B")
    option_c: str = Field(..., min_length=1, description="Option C")
    option_d: str = Field(..., min_length=1, description="Option D")
    correct_option: str = Field(..., description="A, B, C, or D")
    explanation: Optional[str] = None
    points: float = 1.0
    topic: Optional[str] = None

    @field_validator("correct_option")
    @classmethod
    def validate_correct_option(cls, v: str) -> str:
        val = v.strip().upper()
        if val not in {"A", "B", "C", "D"}:
            raise ValueError("correct_option must be 'A', 'B', 'C', or 'D'")
        return val


class TrainerDraftSaveRequest(BaseModel):
    """Schema for saving draft assessment metadata and question items."""

    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    difficulty: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    questions: Optional[List[TrainerDraftQuestionUpdate]] = None


class TrainerDraftSummaryItem(BaseModel):
    """Summary item representing a trainer draft assessment."""

    assessment_id: uuid.UUID
    title: str
    description: Optional[str] = None
    difficulty: str
    status: str
    assessment_type: str
    number_of_questions: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


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
    topic: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def options(self) -> List[str]:
        """Convenience list of options for quiz interfaces."""
        return [self.option_a, self.option_b, self.option_c, self.option_d]


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


# -----------------------------------------------------------------------------
# Practice Quiz Evaluation & Result Schemas (Part 10D)
# -----------------------------------------------------------------------------

class PracticeQuizAnswerSubmit(BaseModel):
    """Answer choice for a single generated practice question."""

    question_id: uuid.UUID
    selected_option: Optional[str] = Field(None, description="A, B, C, D or None if skipped")

    @field_validator("selected_option")
    @classmethod
    def validate_selected_option(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            val = v.strip().upper()
            if val not in {"A", "B", "C", "D"}:
                raise ValueError("selected_option must be 'A', 'B', 'C', or 'D'")
            return val
        return None


class PracticeQuizSubmitRequest(BaseModel):
    """Payload for submitting personal practice quiz answers."""

    answers: List[PracticeQuizAnswerSubmit] = Field(default_factory=list)
    time_taken_seconds: Optional[int] = Field(None, ge=0, description="Total time taken in seconds")


class PracticeQuestionReviewItem(BaseModel):
    """Review item for a practice question showing correctness and explanations."""

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
    topic: Optional[str] = None
    difficulty: Optional[str] = None


class PracticeQuizResultResponse(BaseModel):
    """Scored evaluation result for a personal practice quiz."""

    attempt_id: uuid.UUID
    material_id: uuid.UUID
    material_title: str
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    score: float
    percentage: float
    time_taken_seconds: Optional[int] = None
    submitted_at: datetime
    question_review: List[PracticeQuestionReviewItem] = Field(default_factory=list)


# -----------------------------------------------------------------------------
# AI Learning Feedback & Weak-Topic Analysis Schemas (Part 10E)
# -----------------------------------------------------------------------------

class WeakTopicAnalysis(BaseModel):
    """Detailed diagnosis of a specific weak topic identified during practice."""

    topic: str
    missed_count: int
    total_count: int
    miss_rate: float  # percentage 0.0 - 100.0
    diagnosis: str
    difficulty_spread: Optional[Dict[str, int]] = None


class CompetencyReference(BaseModel):
    """Reference to an existing verified competency in the catalog (no invented IDs)."""

    id: uuid.UUID
    code: str
    name: str
    domain: str
    category: Optional[str] = None


class CourseReference(BaseModel):
    """Reference to an existing active course in the catalog (no invented IDs)."""

    id: uuid.UUID
    title: str
    provider: str
    domain: str
    difficulty: str
    duration_hours: float
    url: Optional[str] = None


class PracticeFeedbackResponse(BaseModel):
    """Comprehensive AI-powered learning feedback and weak-topic analysis for a practice attempt."""

    attempt_id: uuid.UUID
    learning_material_id: uuid.UUID
    material_title: str
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    score: float
    percentage: float
    time_taken_seconds: Optional[int] = None
    overall_summary: str
    strengths: List[str] = Field(default_factory=list)
    weak_topics: List[WeakTopicAnalysis] = Field(default_factory=list)
    weak_skills: List[str] = Field(default_factory=list)
    improvement_areas: List[str] = Field(default_factory=list)
    recommended_next_steps: List[str] = Field(default_factory=list)
    mapped_competencies: List[CompetencyReference] = Field(default_factory=list)
    recommended_courses: List[CourseReference] = Field(default_factory=list)
    generation_mode: str = Field(default="MOCK_FALLBACK", description="'AI' or 'MOCK_FALLBACK'")
    is_mock_fallback: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    disclaimer: str = Field(
        default="Formative personal practice feedback only. Does not alter official competency scores or assessment records."
    )


