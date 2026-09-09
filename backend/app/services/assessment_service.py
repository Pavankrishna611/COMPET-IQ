"""Assessment Management Service.

Handles CRUD operations, question authoring, publishing workflows, and administrative analytics.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.competency import Competency
from app.models.question import Question
from app.models.role import Role
from app.models.user import User
from app.schemas.assessment import (
    AssessmentAssignRequest,
    AssessmentAssignResult,
    AssessmentAssignmentResponse,
    AssessmentCreate,
    AssessmentUpdate,
    AssignableLearnerResponse,
    QuestionCreate,
    QuestionUpdate,
)

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
        user_id: Optional[uuid.UUID] = None,
    ) -> List[Assessment]:
        """List assessments with optional filters. Learners only receive PUBLISHED assessments assigned to them."""
        query = db.query(Assessment)

        if is_learner:
            query = query.filter(Assessment.status == "PUBLISHED")
            if user_id:
                query = query.join(
                    AssessmentAssignment,
                    AssessmentAssignment.assessment_id == Assessment.id,
                ).filter(AssessmentAssignment.user_id == user_id)
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
        """Publish a draft assessment after validating all questions."""
        assessment = AssessmentService.get_assessment(db, assessment_id)
        role_name = current_user.role.name if current_user.role else ""

        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to publish this assessment.",
            )

        questions = (
            db.query(Question)
            .filter(Question.assessment_id == assessment.id)
            .order_by(Question.sequence_order.asc())
            .all()
        )
        if not questions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assessment must contain at least one question before publishing.",
            )

        # Validate every question before publishing
        for q in questions:
            if not q.question_text or not q.question_text.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question {q.sequence_order} must have non-empty question text.",
                )
            if not q.option_a or not q.option_a.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question {q.sequence_order} has an empty Option A.",
                )
            if not q.option_b or not q.option_b.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question {q.sequence_order} has an empty Option B.",
                )
            if not q.option_c or not q.option_c.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question {q.sequence_order} has an empty Option C.",
                )
            if not q.option_d or not q.option_d.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question {q.sequence_order} has an empty Option D.",
                )
            corr = (q.correct_option or "").strip().upper()
            if corr not in {"A", "B", "C", "D"}:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question {q.sequence_order} has an invalid correct option ('{q.correct_option}').",
                )
            opt_map = {"A": q.option_a, "B": q.option_b, "C": q.option_c, "D": q.option_d}
            if not opt_map[corr].strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question {q.sequence_order} correct option '{corr}' references an empty option.",
                )

        assessment.status = "PUBLISHED"
        assessment.published_at = datetime.now(timezone.utc)
        assessment.assessment_type = "TRAINER_OFFICIAL"
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

        if assessment.status == "PUBLISHED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add questions to an already published assessment.",
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

        if assessment.status == "PUBLISHED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify questions of an already published assessment.",
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

        if assessment.status == "PUBLISHED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete questions from an already published assessment.",
            )

        db.delete(question)
        db.commit()

    @staticmethod
    def save_draft_assessment(
        db: Session,
        assessment_id: uuid.UUID,
        payload: Any,
        current_user: User,
    ) -> Assessment:
        """Save updates to a draft assessment and synchronize its questions."""
        assessment = AssessmentService.get_assessment(db, assessment_id)
        role_name = current_user.role.name if current_user.role else ""

        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to edit this draft assessment.",
            )

        if assessment.status == "PUBLISHED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify an already published assessment.",
            )

        if payload.title is not None and payload.title.strip():
            assessment.title = payload.title.strip()
        if payload.description is not None:
            assessment.description = payload.description.strip() if payload.description else None
        if payload.difficulty is not None:
            assessment.difficulty = payload.difficulty.strip().upper()
        if payload.duration_minutes is not None:
            assessment.duration_minutes = payload.duration_minutes

        if payload.questions is not None:
            existing_questions = {q.id: q for q in assessment.questions}
            submitted_ids = set()

            for idx, q_data in enumerate(payload.questions, start=1):
                if not q_data.question_text or not q_data.question_text.strip():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Question {idx} statement cannot be empty.",
                    )
                if (
                    not q_data.option_a.strip()
                    or not q_data.option_b.strip()
                    or not q_data.option_c.strip()
                    or not q_data.option_d.strip()
                ):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Question {idx} options A, B, C, and D must all be non-empty.",
                    )
                corr = q_data.correct_option.strip().upper()
                if corr not in {"A", "B", "C", "D"}:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Question {idx} correct option must be A, B, C, or D.",
                    )

                if q_data.id and q_data.id in existing_questions:
                    q = existing_questions[q_data.id]
                    q.question_text = q_data.question_text.strip()
                    q.question_type = q_data.question_type or "MCQ"
                    q.difficulty = (q_data.difficulty or "MEDIUM").strip().upper()
                    q.option_a = q_data.option_a.strip()
                    q.option_b = q_data.option_b.strip()
                    q.option_c = q_data.option_c.strip()
                    q.option_d = q_data.option_d.strip()
                    q.correct_option = corr
                    q.explanation = q_data.explanation.strip() if q_data.explanation else None
                    q.points = q_data.points or 1.0
                    q.sequence_order = idx
                    submitted_ids.add(q.id)
                else:
                    new_q = Question(
                        assessment_id=assessment.id,
                        question_text=q_data.question_text.strip(),
                        question_type=q_data.question_type or "MCQ",
                        difficulty=(q_data.difficulty or "MEDIUM").strip().upper(),
                        option_a=q_data.option_a.strip(),
                        option_b=q_data.option_b.strip(),
                        option_c=q_data.option_c.strip(),
                        option_d=q_data.option_d.strip(),
                        correct_option=corr,
                        explanation=q_data.explanation.strip() if q_data.explanation else None,
                        points=q_data.points or 1.0,
                        sequence_order=idx,
                    )
                    db.add(new_q)

            # Remove questions that were omitted
            for q_id, q in existing_questions.items():
                if q_id not in submitted_ids:
                    db.delete(q)

        db.commit()
        db.refresh(assessment)
        return assessment

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

    @staticmethod
    def assign_assessment(
        db: Session,
        assessment_id: uuid.UUID,
        assign_in: AssessmentAssignRequest,
        current_user: User,
    ) -> AssessmentAssignResult:
        """Assign a published assessment to one or more learners, skipping duplicates."""
        assessment = AssessmentService.get_assessment(db, assessment_id)
        role_name = current_user.role.name if current_user.role else ""

        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to assign this assessment.",
            )

        if assessment.status != "PUBLISHED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only published assessments can be assigned to learners.",
            )

        existing = (
            db.query(AssessmentAssignment)
            .filter(AssessmentAssignment.assessment_id == assessment_id)
            .all()
        )
        assigned_user_ids = {a.user_id for a in existing}

        assigned_count = 0
        skipped_duplicates = 0
        new_assignments: List[AssessmentAssignment] = []

        unique_incoming = list(dict.fromkeys(assign_in.learner_ids))

        for lid in unique_incoming:
            if lid in assigned_user_ids:
                skipped_duplicates += 1
                continue

            target_user = db.query(User).filter(User.id == lid).first()
            if not target_user:
                continue

            new_assign = AssessmentAssignment(
                assessment_id=assessment.id,
                user_id=lid,
                assigned_by=current_user.id,
                due_date=assign_in.due_date,
                status="ASSIGNED",
            )
            db.add(new_assign)
            new_assignments.append(new_assign)
            assigned_count += 1
            assigned_user_ids.add(lid)

        db.commit()

        all_assignments = (
            db.query(AssessmentAssignment)
            .filter(AssessmentAssignment.assessment_id == assessment_id)
            .order_by(AssessmentAssignment.assigned_at.desc())
            .all()
        )

        resp_list: List[AssessmentAssignmentResponse] = []
        for a in all_assignments:
            u = a.user
            resp_list.append(
                AssessmentAssignmentResponse(
                    id=a.id,
                    assessment_id=a.assessment_id,
                    user_id=a.user_id,
                    learner_name=u.full_name if u else "Unknown",
                    learner_email=u.email if u else "",
                    learner_official_id=u.official_id if u else "",
                    department_name=u.department.name if u and u.department else None,
                    designation=u.designation if u else None,
                    assigned_at=a.assigned_at,
                    due_date=a.due_date,
                    status=a.status,
                )
            )

        msg = (
            f"Successfully assigned assessment to {assigned_count} learner(s)."
            if skipped_duplicates == 0
            else f"Assigned to {assigned_count} learner(s); skipped {skipped_duplicates} duplicate assignment(s)."
        )

        return AssessmentAssignResult(
            assessment_id=assessment.id,
            assigned_count=assigned_count,
            skipped_duplicates_count=skipped_duplicates,
            assignments=resp_list,
            message=msg,
        )

    @staticmethod
    def get_assessment_assignments(
        db: Session,
        assessment_id: uuid.UUID,
        current_user: User,
    ) -> List[AssessmentAssignmentResponse]:
        """Retrieve existing learner assignments for an assessment."""
        assessment = AssessmentService.get_assessment(db, assessment_id)
        role_name = current_user.role.name if current_user.role else ""

        if role_name != "ADMIN" and assessment.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view assignments for this assessment.",
            )

        assignments = (
            db.query(AssessmentAssignment)
            .filter(AssessmentAssignment.assessment_id == assessment_id)
            .order_by(AssessmentAssignment.assigned_at.desc())
            .all()
        )

        res: List[AssessmentAssignmentResponse] = []
        for a in assignments:
            u = a.user
            res.append(
                AssessmentAssignmentResponse(
                    id=a.id,
                    assessment_id=a.assessment_id,
                    user_id=a.user_id,
                    learner_name=u.full_name if u else "Unknown",
                    learner_email=u.email if u else "",
                    learner_official_id=u.official_id if u else "",
                    department_name=u.department.name if u and u.department else None,
                    designation=u.designation if u else None,
                    assigned_at=a.assigned_at,
                    due_date=a.due_date,
                    status=a.status,
                )
            )
        return res

    @staticmethod
    def get_assignable_learners(
        db: Session,
        current_user: User,
    ) -> List[AssignableLearnerResponse]:
        """Fetch active learners that trainers can assign official assessments to."""
        role_name = current_user.role.name if current_user.role else ""
        if role_name not in {"ADMIN", "TRAINER"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only faculty trainers or administrators can browse assignable learners.",
            )

        learner_role = db.query(Role).filter(Role.name == "LEARNER").first()
        query = db.query(User).filter(User.is_active.is_(True))
        if learner_role:
            query = query.filter(User.role_id == learner_role.id)

        learners = query.order_by(User.full_name.asc()).all()

        results: List[AssignableLearnerResponse] = []
        for l in learners:
            curr_assign = l.profile.current_assignment if l.profile and l.profile.current_assignment else None
            dept_name = l.department.name if l.department else None
            results.append(
                AssignableLearnerResponse(
                    id=l.id,
                    official_id=l.official_id,
                    full_name=l.full_name,
                    email=l.email,
                    designation=l.designation,
                    department_name=dept_name,
                    current_assignment=curr_assign,
                )
            )
        return results

