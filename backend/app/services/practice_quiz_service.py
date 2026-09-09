"""Service for evaluating and scoring personal practice quizzes."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.generated_question import GeneratedQuestion
from app.models.learning_material import LearningMaterial
from app.models.practice_quiz_attempt import PracticeQuizAttempt
from app.models.user import User
from app.schemas.ai_assessment import (
    PracticeQuestionReviewItem,
    PracticeQuizResultResponse,
    PracticeQuizSubmitRequest,
)

logger = logging.getLogger("competiq.services.practice_quiz")


class PracticeQuizService:
    """Handles personal formative practice quiz scoring and attempt persistence."""

    @staticmethod
    def evaluate_practice_quiz(
        db: Session,
        current_user: User,
        material_id: uuid.UUID,
        payload: PracticeQuizSubmitRequest,
    ) -> PracticeQuizResultResponse:
        """Score a learner's submitted answers against trusted database questions.
        
        Strict Formative Security Rules:
        1. Learner must own the source material.
        2. Questions must belong to this material and be associated with the learner.
        3. Never trust any client-supplied scores or correct answer options.
        4. Correctness is evaluated strictly against GeneratedQuestion.correct_option in DB.
        5. Does NOT create official competency evidence or update user_competencies.
        """
        material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
        if not material:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Learning material '{material_id}' not found.",
            )

        # Enforce material ownership
        user_role = current_user.role.name if current_user.role else ""
        if user_role != "ADMIN" and material.uploaded_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to submit a practice quiz for this learning material.",
            )

        if not payload.answers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot submit an empty quiz without answers.",
            )

        # Batch lookup all referenced questions
        question_ids = [ans.question_id for ans in payload.answers]
        db_questions = (
            db.query(GeneratedQuestion)
            .filter(
                GeneratedQuestion.id.in_(question_ids),
                GeneratedQuestion.learning_material_id == material.id,
            )
            .all()
        )
        q_map: Dict[uuid.UUID, GeneratedQuestion] = {q.id: q for q in db_questions}

        # Verify all submitted question IDs exist and belong to this material
        for ans in payload.answers:
            if ans.question_id not in q_map:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Question '{ans.question_id}' not found or does not belong to this material.",
                )

        # Server-side scoring against trusted correct_option
        correct_count = 0
        total_count = len(payload.answers)
        review_items: List[PracticeQuestionReviewItem] = []

        for ans in payload.answers:
            gen_q = q_map[ans.question_id]
            selected = ans.selected_option.strip().upper() if ans.selected_option else None
            correct = gen_q.correct_option.strip().upper()
            is_correct = (selected == correct) if selected else False

            if is_correct:
                correct_count += 1

            review_items.append(
                PracticeQuestionReviewItem(
                    question_id=gen_q.id,
                    question_text=gen_q.question_text,
                    option_a=gen_q.option_a,
                    option_b=gen_q.option_b,
                    option_c=gen_q.option_c,
                    option_d=gen_q.option_d,
                    selected_option=selected,
                    correct_option=correct,
                    is_correct=is_correct,
                    explanation=gen_q.explanation,
                    topic=gen_q.topic,
                    difficulty=gen_q.difficulty,
                )
            )

        incorrect_count = total_count - correct_count
        score = float(correct_count)
        percentage = round((correct_count / total_count * 100.0), 1) if total_count > 0 else 0.0

        # Persist practice attempt isolated from official exams
        serialized_reviews = [item.model_dump(mode="json") for item in review_items]
        attempt = PracticeQuizAttempt(
            user_id=current_user.id,
            learning_material_id=material.id,
            total_questions=total_count,
            correct_answers=correct_count,
            incorrect_answers=incorrect_count,
            score=score,
            percentage=percentage,
            time_taken_seconds=payload.time_taken_seconds,
            submitted_answers=serialized_reviews,
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        logger.info(
            f"Evaluated practice quiz for user {current_user.id} on material {material.id}: "
            f"{correct_count}/{total_count} ({percentage}%)"
        )

        return PracticeQuizResultResponse(
            attempt_id=attempt.id,
            material_id=material.id,
            material_title=material.title,
            total_questions=total_count,
            correct_answers=correct_count,
            incorrect_answers=incorrect_count,
            score=score,
            percentage=percentage,
            time_taken_seconds=payload.time_taken_seconds,
            submitted_at=attempt.created_at,
            question_review=review_items,
        )

    @staticmethod
    def get_practice_quiz_result(
        db: Session,
        current_user: User,
        attempt_id: uuid.UUID,
    ) -> PracticeQuizResultResponse:
        """Retrieve a previous practice quiz result for review."""
        attempt = (
            db.query(PracticeQuizAttempt)
            .filter(PracticeQuizAttempt.id == attempt_id)
            .first()
        )
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Practice quiz attempt '{attempt_id}' not found.",
            )

        # Enforce attempt ownership (Another learner cannot view this attempt)
        user_role = current_user.role.name if current_user.role else ""
        if user_role != "ADMIN" and attempt.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this practice quiz attempt.",
            )

        review_items: List[PracticeQuestionReviewItem] = []
        if attempt.submitted_answers:
            for item_dict in attempt.submitted_answers:
                try:
                    review_items.append(PracticeQuestionReviewItem(**item_dict))
                except Exception as exc:
                    logger.warning(f"Failed to parse stored review item: {exc}")

        mat_title = attempt.learning_material.title if attempt.learning_material else "Practice Material"

        return PracticeQuizResultResponse(
            attempt_id=attempt.id,
            material_id=attempt.learning_material_id,
            material_title=mat_title,
            total_questions=attempt.total_questions,
            correct_answers=attempt.correct_answers,
            incorrect_answers=attempt.incorrect_answers,
            score=attempt.score,
            percentage=attempt.percentage,
            time_taken_seconds=attempt.time_taken_seconds,
            submitted_at=attempt.created_at,
            question_review=review_items,
        )
