"""Assessment Management Service.

Handles CRUD operations, question authoring, publishing workflows, and administrative analytics.
"""

import logging
import uuid
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.competency import Competency
from app.models.question import Question
from app.models.user import User
from app.schemas.assessment import AssessmentCreate, AssessmentUpdate, QuestionCreate, QuestionUpdate

logger = logging.getLogger("competiq.services.assessment")


class AssessmentService:
    """Service handling assessment catalog, question configuration, and publication lifecycle."""

    @staticmethod
    def create_assessment(
        db: Session,
        assessment_in: AssessmentCreate,
        creator_id: Optional[uuid.UUID] = None,
    ) -> Assessment:
        """Create a new assessment initially in DRAFT state."""
        assessment = Assessment(
            title=assessment_in.title,
            description=assessment_in.description,
            instructions=assessment_in.instructions,
            duration_minutes=assessment_in.duration_minutes,
            difficulty=assessment_in.difficulty,
            status="DRAFT",
            created_by=creator_id,
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        return assessment

    @staticmethod
    def get_assessment(db: Session, assessment_id: uuid.UUID) -> Assessment:
        """Retrieve an assessment by ID or raise 404."""
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assessment with ID '{assessment_id}' not found.",
            )
        return assessment

    @staticmethod
    def get_assessments(
        db: Session,
        status_filter: Optional[str] = None,
        difficulty: Optional[str] = None,
        is_learner: bool = False,
    ) -> List[Assessment]:
        """List assessments with optional filters. Learners only receive PUBLISHED assessments."""
        query = db.query(Assessment)

        if is_learner:
            query = query.filter(Assessment.status == "PUBLISHED")
        elif status_filter:
            query = query.filter(Assessment.status == status_filter.upper())

        if difficulty:
            query = query.filter(Assessment.difficulty == difficulty.upper())

        return query.order_by(Assessment.created_at.desc()).all()

    @staticmethod
    def update_assessment(
        db: Session,
        assessment_id: uuid.UUID,
        assessment_in: AssessmentUpdate,
        current_user: User,
    ) -> Assessment:
        """Update an assessment. Only ADMIN or creator TRAINER is authorized."""
        assessment = AssessmentService.get_assessment(db, assessment_id)
        role_name = current_user.role.name if current_user.role else ""

        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this assessment.",
            )

        update_data = assessment_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(assessment, field, value)

        db.commit()
        db.refresh(assessment)
        return assessment

    @staticmethod
    def delete_assessment(
        db: Session,
        assessment_id: uuid.UUID,
        current_user: User,
    ) -> None:
        """Safely delete an assessment if no attempts exist."""
        assessment = AssessmentService.get_assessment(db, assessment_id)
        role_name = current_user.role.name if current_user.role else ""

        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this assessment.",
            )

        # Check for existing attempts
        attempt_count = (
            db.query(func.count(AssessmentAttempt.id))
            .filter(AssessmentAttempt.assessment_id == assessment.id)
            .scalar()
            or 0
        )
        if attempt_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete assessment with existing attempts. Archive it instead.",
            )

        db.delete(assessment)
        db.commit()

    @staticmethod
    def publish_assessment(
        db: Session,
        assessment_id: uuid.UUID,
        current_user: User,
    ) -> Assessment:
        """Publish a draft assessment after validating that questions exist."""
        assessment = AssessmentService.get_assessment(db, assessment_id)
        role_name = current_user.role.name if current_user.role else ""

        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to publish this assessment.",
            )

        question_count = (
            db.query(func.count(Question.id))
            .filter(Question.assessment_id == assessment.id)
            .scalar()
            or 0
        )
        if question_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assessment must contain at least one question before publishing.",
            )

        assessment.status = "PUBLISHED"
        db.commit()
        db.refresh(assessment)
        return assessment

    @staticmethod
    def archive_assessment(
        db: Session,
        assessment_id: uuid.UUID,
        current_user: User,
    ) -> Assessment:
        """Archive an assessment."""
        assessment = AssessmentService.get_assessment(db, assessment_id)
        role_name = current_user.role.name if current_user.role else ""

        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to archive this assessment.",
            )

        assessment.status = "ARCHIVED"
        db.commit()
        db.refresh(assessment)
        return assessment

    # --- Question Management Methods ---

    @staticmethod
    def add_question(
        db: Session,
        assessment_id: uuid.UUID,
        question_in: QuestionCreate,
        current_user: User,
    ) -> Question:
        """Add a question to an assessment."""
        assessment = AssessmentService.get_assessment(db, assessment_id)
        role_name = current_user.role.name if current_user.role else ""

        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to add questions to this assessment.",
            )

        if question_in.competency_id:
            comp = db.query(Competency).filter(Competency.id == question_in.competency_id).first()
            if not comp:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target competency '{question_in.competency_id}' not found.",
                )

        question = Question(
            assessment_id=assessment.id,
            competency_id=question_in.competency_id,
            question_text=question_in.question_text,
            question_type=question_in.question_type,
            difficulty=question_in.difficulty,
            option_a=question_in.option_a,
            option_b=question_in.option_b,
            option_c=question_in.option_c,
            option_d=question_in.option_d,
            correct_option=question_in.correct_option,
            explanation=question_in.explanation,
            points=question_in.points,
            sequence_order=question_in.sequence_order,
        )
        db.add(question)
        db.commit()
        db.refresh(question)
        return question

    @staticmethod
    def update_question(
        db: Session,
        question_id: uuid.UUID,
        question_in: QuestionUpdate,
        current_user: User,
    ) -> Question:
        """Update a question."""
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question with ID '{question_id}' not found.",
            )

        assessment = question.assessment
        role_name = current_user.role.name if current_user.role else ""
        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this question.",
            )

        update_data = question_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(question, field, value)

        db.commit()
        db.refresh(question)
        return question

    @staticmethod
    def delete_question(
        db: Session,
        question_id: uuid.UUID,
        current_user: User,
    ) -> None:
        """Delete a question."""
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question with ID '{question_id}' not found.",
            )

        assessment = question.assessment
        role_name = current_user.role.name if current_user.role else ""
        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this question.",
            )

        db.delete(question)
        db.commit()

    @staticmethod
    def get_assessment_questions(
        db: Session,
        assessment_id: uuid.UUID,
    ) -> List[Question]:
        """Retrieve all questions for an assessment ordered by sequence."""
        return (
            db.query(Question)
            .filter(Question.assessment_id == assessment_id)
            .order_by(Question.sequence_order.asc())
            .all()
        )
