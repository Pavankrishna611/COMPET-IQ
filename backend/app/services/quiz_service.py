"""Quiz Evaluation and Scoring Engine.

Manages test session lifecycle, answer recordings, objective scoring, competency performance breakdown, and post-test review.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.competency import Competency
from app.models.question import Question
from app.models.question_attempt import QuestionAttempt
from app.models.user import User
from app.schemas.assessment import AssessmentAnalyticsResponse, AssessmentResponse, QuestionLearnerResponse
from app.schemas.quiz import (
    CompetencyScore,
    QuestionAnswerSubmit,
    QuestionReviewItem,
    QuizActiveResponse,
    QuizResultResponse,
    QuizStartResponse,
    UserAttemptHistoryItem,
)
from app.services.competency_update_service import update_user_competencies_from_assessment

logger = logging.getLogger("competiq.services.quiz")


class QuizService:
    """Service orchestrating quiz execution, scoring, and performance analytics."""

    @staticmethod
    def start_quiz(
        db: Session,
        user_id: uuid.UUID,
        assessment_id: uuid.UUID,
    ) -> QuizStartResponse:
        """Start a new quiz session or resume an existing IN_PROGRESS attempt for a published assessment."""
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assessment with ID '{assessment_id}' not found.",
            )

        if assessment.status != "PUBLISHED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot start an unpublished assessment.",
            )

        # Check for existing IN_PROGRESS attempt
        existing_attempt = (
            db.query(AssessmentAttempt)
            .filter(
                AssessmentAttempt.user_id == user_id,
                AssessmentAttempt.assessment_id == assessment_id,
                AssessmentAttempt.status == "IN_PROGRESS",
            )
            .first()
        )

        now = datetime.now(timezone.utc)
        if existing_attempt:
            attempt = existing_attempt
            logger.info(f"Resuming existing attempt {attempt.id} for user {user_id}")
        else:
            attempt = AssessmentAttempt(
                user_id=user_id,
                assessment_id=assessment_id,
                started_at=now,
                status="IN_PROGRESS",
            )
            db.add(attempt)
            db.commit()
            db.refresh(attempt)
            logger.info(f"Created new quiz attempt {attempt.id} for user {user_id}")

        # Fetch learner-safe questions (strictly omit correct_option & explanation)
        questions = (
            db.query(Question)
            .filter(Question.assessment_id == assessment_id)
            .order_by(Question.sequence_order.asc())
            .all()
        )

        learner_questions = [
            QuestionLearnerResponse(
                id=q.id,
                assessment_id=q.assessment_id,
                competency_id=q.competency_id,
                competency_name=q.competency.name if q.competency else None,
                question_text=q.question_text,
                question_type=q.question_type,
                difficulty=q.difficulty,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                points=q.points,
                sequence_order=q.sequence_order,
            )
            for q in questions
        ]

        assessment_resp = AssessmentResponse(
            id=assessment.id,
            title=assessment.title,
            description=assessment.description,
            instructions=assessment.instructions,
            duration_minutes=assessment.duration_minutes,
            difficulty=assessment.difficulty,
            status=assessment.status,
            question_count=len(learner_questions),
            created_at=assessment.created_at,
            updated_at=assessment.updated_at,
        )

        return QuizStartResponse(
            attempt_id=attempt.id,
            assessment=assessment_resp,
            questions=learner_questions,
            started_at=attempt.started_at,
        )

    @staticmethod
    def get_active_quiz(
        db: Session,
        user_id: uuid.UUID,
        attempt_id: uuid.UUID,
    ) -> QuizActiveResponse:
        """Retrieve an active quiz attempt along with current saved answers."""
        attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz attempt '{attempt_id}' not found.",
            )

        if attempt.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to access this quiz attempt.",
            )

        if attempt.status != "IN_PROGRESS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This quiz attempt has already been {attempt.status.lower()}.",
            )

        assessment = attempt.assessment
        questions = (
            db.query(Question)
            .filter(Question.assessment_id == assessment.id)
            .order_by(Question.sequence_order.asc())
            .all()
        )

        saved_records = (
            db.query(QuestionAttempt)
            .filter(QuestionAttempt.attempt_id == attempt.id)
            .all()
        )
        saved_map = {str(r.question_id): r.selected_option for r in saved_records}

        learner_questions = [
            QuestionLearnerResponse(
                id=q.id,
                assessment_id=q.assessment_id,
                competency_id=q.competency_id,
                competency_name=q.competency.name if q.competency else None,
                question_text=q.question_text,
                question_type=q.question_type,
                difficulty=q.difficulty,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                points=q.points,
                sequence_order=q.sequence_order,
            )
            for q in questions
        ]

        assessment_resp = AssessmentResponse(
            id=assessment.id,
            title=assessment.title,
            description=assessment.description,
            instructions=assessment.instructions,
            duration_minutes=assessment.duration_minutes,
            difficulty=assessment.difficulty,
            status=assessment.status,
            question_count=len(learner_questions),
            created_at=assessment.created_at,
            updated_at=assessment.updated_at,
        )

        return QuizActiveResponse(
            attempt_id=attempt.id,
            assessment=assessment_resp,
            questions=learner_questions,
            saved_answers=saved_map,
            started_at=attempt.started_at,
            duration_minutes=assessment.duration_minutes,
            status=attempt.status,
        )

    @staticmethod
    def save_answer(
        db: Session,
        user_id: uuid.UUID,
        attempt_id: uuid.UUID,
        question_id: uuid.UUID,
        selected_option: Optional[str],
    ) -> None:
        """Upsert a single answer choice for an in-progress attempt."""
        attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz attempt '{attempt_id}' not found.",
            )

        if attempt.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update this quiz attempt.",
            )

        if attempt.status != "IN_PROGRESS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot save answer; quiz attempt is already {attempt.status.lower()}.",
            )

        question = db.query(Question).filter(Question.id == question_id).first()
        if not question or question.assessment_id != attempt.assessment_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question '{question_id}' does not belong to this assessment.",
            )

        # Upsert question attempt
        qa = (
            db.query(QuestionAttempt)
            .filter(
                QuestionAttempt.attempt_id == attempt.id,
                QuestionAttempt.question_id == question.id,
            )
            .first()
        )

        val = selected_option.strip().upper() if selected_option else None

        if qa:
            qa.selected_option = val
        else:
            qa = QuestionAttempt(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option=val,
            )
            db.add(qa)

        db.commit()

    @staticmethod
    def submit_quiz(
        db: Session,
        user_id: uuid.UUID,
        attempt_id: uuid.UUID,
        submitted_answers: Optional[List[QuestionAnswerSubmit]] = None,
    ) -> QuizResultResponse:
        """Submit and score a quiz attempt, calculate competency breakdown, and update learner profile."""
        attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz attempt '{attempt_id}' not found.",
            )

        if attempt.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to submit this quiz attempt.",
            )

        if attempt.status != "IN_PROGRESS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This quiz attempt has already been {attempt.status.lower()}.",
            )

        # Upsert any answers passed during final submit
        if submitted_answers:
            for ans in submitted_answers:
                qa = (
                    db.query(QuestionAttempt)
                    .filter(
                        QuestionAttempt.attempt_id == attempt.id,
                        QuestionAttempt.question_id == ans.question_id,
                    )
                    .first()
                )
                val = ans.selected_option.strip().upper() if ans.selected_option else None
                if qa:
                    qa.selected_option = val
                else:
                    qa = QuestionAttempt(
                        attempt_id=attempt.id,
                        question_id=ans.question_id,
                        selected_option=val,
                    )
                    db.add(qa)
            db.commit()

        # Load all questions for the assessment
        questions = (
            db.query(Question)
            .filter(Question.assessment_id == attempt.assessment_id)
            .order_by(Question.sequence_order.asc())
            .all()
        )

        # Load recorded question attempts
        existing_qas = (
            db.query(QuestionAttempt)
            .filter(QuestionAttempt.attempt_id == attempt.id)
            .all()
        )
        qa_by_qid = {qa.question_id: qa for qa in existing_qas}

        total_questions = len(questions)
        correct_count = 0
        total_points = 0.0
        earned_points = 0.0

        # Competency tracking structure: {comp_id: {"name": str, "total": int, "correct": int}}
        comp_map: Dict[Optional[uuid.UUID], Dict[str, Any]] = {}
        review_items: List[QuestionReviewItem] = []

        for q in questions:
            total_points += q.points
            comp_id = q.competency_id
            comp_name = q.competency.name if q.competency else "General"

            if comp_id not in comp_map:
                comp_map[comp_id] = {"name": comp_name, "total": 0, "correct": 0}
            comp_map[comp_id]["total"] += 1

            qa = qa_by_qid.get(q.id)
            if not qa:
                qa = QuestionAttempt(
                    attempt_id=attempt.id,
                    question_id=q.id,
                    selected_option=None,
                )
                db.add(qa)
                db.flush()
                qa_by_qid[q.id] = qa

            selected = qa.selected_option
            is_correct = (selected == q.correct_option)
            points_awarded = q.points if is_correct else 0.0

            qa.is_correct = is_correct
            qa.points_earned = points_awarded

            if is_correct:
                correct_count += 1
                comp_map[comp_id]["correct"] += 1
                earned_points += points_awarded

            review_items.append(
                QuestionReviewItem(
                    question_id=q.id,
                    question_text=q.question_text,
                    option_a=q.option_a,
                    option_b=q.option_b,
                    option_c=q.option_c,
                    option_d=q.option_d,
                    selected_option=selected,
                    correct_option=q.correct_option,
                    is_correct=is_correct,
                    explanation=q.explanation,
                    points_earned=points_awarded,
                    max_points=q.points,
                    competency_name=comp_name,
                )
            )

        percentage = round((earned_points / total_points * 100.0), 2) if total_points > 0 else 0.0
        now = datetime.now(timezone.utc)
        if attempt.started_at:
            start_dt = attempt.started_at
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=timezone.utc)
            time_taken = max(0, int((now - start_dt).total_seconds()))
        else:
            time_taken = None

        # Build competency breakdown list
        competency_breakdown: List[CompetencyScore] = []
        competency_scores_for_update: List[Dict] = []

        for cid, stats in comp_map.items():
            tot = stats["total"]
            corr = stats["correct"]
            pct = round((corr / tot * 100.0), 2) if tot > 0 else 0.0
            breakdown_item = CompetencyScore(
                competency_id=cid,
                competency_name=stats["name"],
                total_questions=tot,
                correct_answers=corr,
                percentage=pct,
            )
            competency_breakdown.append(breakdown_item)
            if cid:
                competency_scores_for_update.append({
                    "competency_id": cid,
                    "competency_name": stats["name"],
                    "percentage": pct,
                })

        # Finalize attempt model
        attempt.status = "EVALUATED"
        attempt.submitted_at = now
        attempt.score = round(earned_points, 2)
        attempt.percentage = percentage
        attempt.total_questions = total_questions
        attempt.correct_answers = correct_count
        attempt.time_taken_seconds = time_taken

        db.commit()
        db.refresh(attempt)

        # Trigger Competency Profile Update Engine
        if competency_scores_for_update:
            update_user_competencies_from_assessment(
                db=db,
                user_id=user_id,
                competency_scores=competency_scores_for_update,
            )

        assessment = attempt.assessment
        assessment_resp = AssessmentResponse(
            id=assessment.id,
            title=assessment.title,
            description=assessment.description,
            instructions=assessment.instructions,
            duration_minutes=assessment.duration_minutes,
            difficulty=assessment.difficulty,
            status=assessment.status,
            question_count=total_questions,
            created_at=assessment.created_at,
            updated_at=assessment.updated_at,
        )

        return QuizResultResponse(
            attempt_id=attempt.id,
            assessment=assessment_resp,
            score=attempt.score,
            percentage=attempt.percentage,
            correct_answers=attempt.correct_answers,
            incorrect_answers=total_questions - attempt.correct_answers,
            total_questions=total_questions,
            time_taken_seconds=attempt.time_taken_seconds,
            competency_breakdown=competency_breakdown,
            submitted_at=attempt.submitted_at or now,
            question_review=review_items,
        )

    @staticmethod
    def get_quiz_result(
        db: Session,
        attempt_id: uuid.UUID,
        current_user: User,
    ) -> QuizResultResponse:
        """Retrieve completed quiz results and review. Only attempt owner, Trainer, or Admin can access."""
        attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz attempt '{attempt_id}' not found.",
            )

        role_name = current_user.role.name if current_user.role else ""
        if role_name not in {"ADMIN", "TRAINER"} and attempt.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this quiz result.",
            )

        if attempt.status == "IN_PROGRESS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quiz attempt is still in progress and has not been submitted.",
            )

        questions = (
            db.query(Question)
            .filter(Question.assessment_id == attempt.assessment_id)
            .order_by(Question.sequence_order.asc())
            .all()
        )

        qas = (
            db.query(QuestionAttempt)
            .filter(QuestionAttempt.attempt_id == attempt.id)
            .all()
        )
        qa_by_qid = {qa.question_id: qa for qa in qas}

        comp_map: Dict[Optional[uuid.UUID], Dict[str, Any]] = {}
        review_items: List[QuestionReviewItem] = []

        for q in questions:
            cid = q.competency_id
            cname = q.competency.name if q.competency else "General"
            if cid not in comp_map:
                comp_map[cid] = {"name": cname, "total": 0, "correct": 0}
            comp_map[cid]["total"] += 1

            qa = qa_by_qid.get(q.id)
            selected = qa.selected_option if qa else None
            is_corr = qa.is_correct if qa else False
            points_awarded = qa.points_earned if qa else 0.0

            if is_corr:
                comp_map[cid]["correct"] += 1

            review_items.append(
                QuestionReviewItem(
                    question_id=q.id,
                    question_text=q.question_text,
                    option_a=q.option_a,
                    option_b=q.option_b,
                    option_c=q.option_c,
                    option_d=q.option_d,
                    selected_option=selected,
                    correct_option=q.correct_option,
                    is_correct=is_corr,
                    explanation=q.explanation,
                    points_earned=points_awarded,
                    max_points=q.points,
                    competency_name=cname,
                )
            )

        competency_breakdown = [
            CompetencyScore(
                competency_id=cid,
                competency_name=stats["name"],
                total_questions=stats["total"],
                correct_answers=stats["correct"],
                percentage=round((stats["correct"] / stats["total"] * 100.0), 2) if stats["total"] > 0 else 0.0,
            )
            for cid, stats in comp_map.items()
        ]

        assessment = attempt.assessment
        assessment_resp = AssessmentResponse(
            id=assessment.id,
            title=assessment.title,
            description=assessment.description,
            instructions=assessment.instructions,
            duration_minutes=assessment.duration_minutes,
            difficulty=assessment.difficulty,
            status=assessment.status,
            question_count=len(questions),
            created_at=assessment.created_at,
            updated_at=assessment.updated_at,
        )

        return QuizResultResponse(
            attempt_id=attempt.id,
            assessment=assessment_resp,
            score=attempt.score,
            percentage=attempt.percentage,
            correct_answers=attempt.correct_answers,
            incorrect_answers=attempt.total_questions - attempt.correct_answers,
            total_questions=attempt.total_questions,
            time_taken_seconds=attempt.time_taken_seconds,
            competency_breakdown=competency_breakdown,
            submitted_at=attempt.submitted_at or attempt.updated_at,
            question_review=review_items,
        )

    @staticmethod
    def get_user_attempts(
        db: Session,
        user_id: uuid.UUID,
        status_filter: Optional[str] = None,
        assessment_id: Optional[uuid.UUID] = None,
    ) -> List[UserAttemptHistoryItem]:
        """Fetch historical assessment attempts for a user."""
        query = db.query(AssessmentAttempt).filter(AssessmentAttempt.user_id == user_id)

        if status_filter:
            query = query.filter(AssessmentAttempt.status == status_filter.upper())
        if assessment_id:
            query = query.filter(AssessmentAttempt.assessment_id == assessment_id)

        attempts = query.order_by(AssessmentAttempt.started_at.desc()).all()

        return [
            UserAttemptHistoryItem(
                attempt_id=att.id,
                assessment_id=att.assessment_id,
                assessment_title=att.assessment.title if att.assessment else "Assessment",
                status=att.status,
                score=att.score,
                percentage=att.percentage,
                started_at=att.started_at,
                submitted_at=att.submitted_at,
            )
            for att in attempts
        ]

    @staticmethod
    def get_assessment_analytics(
        db: Session,
        assessment_id: uuid.UUID,
    ) -> AssessmentAnalyticsResponse:
        """Aggregate statistical performance metrics across all attempts for an assessment."""
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assessment '{assessment_id}' not found.",
            )

        completed_attempts = (
            db.query(AssessmentAttempt)
            .filter(
                AssessmentAttempt.assessment_id == assessment.id,
                AssessmentAttempt.status.in_(["SUBMITTED", "EVALUATED"]),
            )
            .all()
        )

        total_attempts = len(completed_attempts)
        if total_attempts == 0:
            return AssessmentAnalyticsResponse(
                assessment_id=assessment.id,
                assessment_title=assessment.title,
                total_attempts=0,
                average_score=0.0,
                average_percentage=0.0,
                highest_score=0.0,
                lowest_score=0.0,
                competency_performance=[],
            )

        scores = [a.score for a in completed_attempts]
        percentages = [a.percentage for a in completed_attempts]

        avg_score = round(sum(scores) / total_attempts, 2)
        avg_pct = round(sum(percentages) / total_attempts, 2)
        hi_score = max(scores)
        lo_score = min(scores)

        # Aggregate competency performance across all question attempts
        # Group by Question.competency_id
        qa_stats = (
            db.query(
                Question.competency_id,
                func.count(QuestionAttempt.id).label("total_answers"),
                func.sum(case((QuestionAttempt.is_correct == True, 1), else_=0)).label("correct_answers"),
            )
            .join(Question, Question.id == QuestionAttempt.question_id)
            .join(AssessmentAttempt, AssessmentAttempt.id == QuestionAttempt.attempt_id)
            .filter(
                AssessmentAttempt.assessment_id == assessment.id,
                AssessmentAttempt.status.in_(["SUBMITTED", "EVALUATED"]),
            )
            .group_by(Question.competency_id)
            .all()
        )

        comp_perf: List[Dict[str, Any]] = []
        for r in qa_stats:
            cid = r[0]
            tot = r[1] or 0
            corr = int(r[2] or 0)
            pct = round((corr / tot * 100.0), 2) if tot > 0 else 0.0
            comp_obj = db.query(Competency).filter(Competency.id == cid).first() if cid else None
            comp_perf.append({
                "competency_id": str(cid) if cid else None,
                "competency_name": comp_obj.name if comp_obj else "General",
                "total_answers": tot,
                "correct_answers": corr,
                "percentage": pct,
            })

        return AssessmentAnalyticsResponse(
            assessment_id=assessment.id,
            assessment_title=assessment.title,
            total_attempts=total_attempts,
            average_score=avg_score,
            average_percentage=avg_pct,
            highest_score=hi_score,
            lowest_score=lo_score,
            competency_performance=comp_perf,
        )
