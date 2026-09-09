"""Assessment Management Endpoints.

Provides administrative and trainer endpoints for assessment creation, publishing, question editing, and analytics.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.assessment_assignment import AssessmentAssignment
from app.models.user import User
from app.schemas.assessment import (
    AssessmentAnalyticsResponse,
    AssessmentAssignRequest,
    AssessmentAssignResult,
    AssessmentAssignmentResponse,
    AssessmentCreate,
    AssessmentDetailResponse,
    AssessmentResponse,
    AssessmentUpdate,
    AssignableLearnerResponse,
    QuestionAdminResponse,
    QuestionCreate,
    QuestionLearnerResponse,
    QuestionUpdate,
)
from app.services.assessment_service import AssessmentService
from app.services.quiz_service import QuizService

router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


@router.post(
    "",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Assessment (Trainer/Admin)",
    description="Create a new draft assessment in the catalog.",
)
def create_assessment(
    assessment_in: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> AssessmentResponse:
    """Create a new assessment in DRAFT status."""
    assessment = AssessmentService.create_assessment(
        db=db,
        assessment_in=assessment_in,
        creator_id=current_user.id,
    )
    return AssessmentResponse(
        id=assessment.id,
        title=assessment.title,
        description=assessment.description,
        instructions=assessment.instructions,
        duration_minutes=assessment.duration_minutes,
        difficulty=assessment.difficulty,
        status=assessment.status,
        question_count=0,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
    )


@router.get(
    "",
    response_model=List[AssessmentResponse],
    status_code=status.HTTP_200_OK,
    summary="List Assessments",
    description="List all available assessments. Learners only receive PUBLISHED assessments assigned to them.",
)
def list_assessments(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (DRAFT, PUBLISHED, ARCHIVED)"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[AssessmentResponse]:
    """Retrieve assessments catalog."""
    role_name = current_user.role.name if current_user.role else ""
    is_learner = (role_name == "LEARNER")

    assessments = AssessmentService.get_assessments(
        db=db,
        status_filter=status_filter,
        difficulty=difficulty,
        is_learner=is_learner,
        user_id=current_user.id if is_learner else None,
    )

    assignment_map = {}
    if is_learner:
        assignments = (
            db.query(AssessmentAssignment)
            .filter(AssessmentAssignment.user_id == current_user.id)
            .all()
        )
        assignment_map = {a.assessment_id: a for a in assignments}

    results: List[AssessmentResponse] = []
    for ass in assessments:
        user_assign = assignment_map.get(ass.id)
        due_date = user_assign.due_date if user_assign else None
        assigned_count = len(ass.assignments) if hasattr(ass, "assignments") and ass.assignments else 0
        results.append(
            AssessmentResponse(
                id=ass.id,
                title=ass.title,
                description=ass.description,
                instructions=ass.instructions,
                duration_minutes=ass.duration_minutes,
                difficulty=ass.difficulty,
                status=ass.status,
                question_count=len(ass.questions),
                created_at=ass.created_at,
                updated_at=ass.updated_at,
                published_at=ass.published_at,
                due_date=due_date,
                assigned_to_me=True if is_learner else None,
                assigned_learners_count=assigned_count,
            )
        )
    return results


# -----------------------------------------------------------------------------
# Question endpoints with static prefix declared before /{assessment_id}
# -----------------------------------------------------------------------------
@router.put(
    "/questions/{question_id}",
    response_model=QuestionAdminResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Question (Trainer/Admin)",
    description="Update an existing question's text, options, or competency mapping.",
)
def update_question(
    question_id: uuid.UUID,
    question_in: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> QuestionAdminResponse:
    """Update question content and details."""
    question = AssessmentService.update_question(
        db=db,
        question_id=question_id,
        question_in=question_in,
        current_user=current_user,
    )
    return QuestionAdminResponse(
        id=question.id,
        assessment_id=question.assessment_id,
        competency_id=question.competency_id,
        competency_name=question.competency.name if question.competency else None,
        question_text=question.question_text,
        question_type=question.question_type,
        difficulty=question.difficulty,
        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,
        correct_option=question.correct_option,
        explanation=question.explanation,
        points=question.points,
        sequence_order=question.sequence_order,
        created_at=question.created_at,
        updated_at=question.updated_at,
    )


@router.delete(
    "/questions/{question_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Question (Trainer/Admin)",
    description="Remove a question from an assessment.",
)
def delete_question(
    question_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> dict:
    """Delete a question."""
    AssessmentService.delete_question(
        db=db,
        question_id=question_id,
        current_user=current_user,
    )
    return {"message": "Question deleted successfully."}


# -----------------------------------------------------------------------------
# Assessment Detail & Action Endpoints
# -----------------------------------------------------------------------------
@router.get(
    "/{assessment_id}/results",
    response_model=AssessmentAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Assessment Results Analytics (Trainer/Admin)",
    description="Aggregate performance statistics across all attempts for an assessment.",
)
def get_assessment_analytics(
    assessment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> AssessmentAnalyticsResponse:
    """Retrieve statistical performance analytics."""
    return QuizService.get_assessment_analytics(db=db, assessment_id=assessment_id)


@router.post(
    "/{assessment_id}/publish",
    response_model=AssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Publish Assessment (Trainer/Admin)",
    description="Transition an assessment from DRAFT to PUBLISHED.",
)
def publish_assessment(
    assessment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> AssessmentResponse:
    """Publish assessment after ensuring questions exist."""
    assessment = AssessmentService.publish_assessment(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user,
    )
    return AssessmentResponse(
        id=assessment.id,
        title=assessment.title,
        description=assessment.description,
        instructions=assessment.instructions,
        duration_minutes=assessment.duration_minutes,
        difficulty=assessment.difficulty,
        status=assessment.status,
        question_count=len(assessment.questions),
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
    )


@router.post(
    "/{assessment_id}/archive",
    response_model=AssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Archive Assessment (Trainer/Admin)",
    description="Transition an assessment to ARCHIVED state.",
)
def archive_assessment(
    assessment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> AssessmentResponse:
    """Archive assessment."""
    assessment = AssessmentService.archive_assessment(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user,
    )
    return AssessmentResponse(
        id=assessment.id,
        title=assessment.title,
        description=assessment.description,
        instructions=assessment.instructions,
        duration_minutes=assessment.duration_minutes,
        difficulty=assessment.difficulty,
        status=assessment.status,
        question_count=len(assessment.questions),
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
    )


@router.post(
    "/{assessment_id}/questions",
    response_model=QuestionAdminResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Question to Assessment (Trainer/Admin)",
    description="Add a new question with options, correct answer, and competency alignment.",
)
def add_question(
    assessment_id: uuid.UUID,
    question_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> QuestionAdminResponse:
    """Add a question to an assessment."""
    question = AssessmentService.add_question(
        db=db,
        assessment_id=assessment_id,
        question_in=question_in,
        current_user=current_user,
    )
    return QuestionAdminResponse(
        id=question.id,
        assessment_id=question.assessment_id,
        competency_id=question.competency_id,
        competency_name=question.competency.name if question.competency else None,
        question_text=question.question_text,
        question_type=question.question_type,
        difficulty=question.difficulty,
        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,
        correct_option=question.correct_option,
        explanation=question.explanation,
        points=question.points,
        sequence_order=question.sequence_order,
        created_at=question.created_at,
        updated_at=question.updated_at,
    )


@router.get(
    "/{assessment_id}/questions",
    response_model=List[QuestionAdminResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Assessment Questions (Trainer/Admin)",
    description="Retrieve all questions for an assessment including correct options and explanations.",
)
def get_assessment_questions(
    assessment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> List[QuestionAdminResponse]:
    """Retrieve full question list for management."""
    questions = AssessmentService.get_assessment_questions(
        db=db,
        assessment_id=assessment_id,
    )
    return [
        QuestionAdminResponse(
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
            correct_option=q.correct_option,
            explanation=q.explanation,
            points=q.points,
            sequence_order=q.sequence_order,
            created_at=q.created_at,
            updated_at=q.updated_at,
        )
        for q in questions
    ]


@router.get(
    "/learners/available",
    response_model=List[AssignableLearnerResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Assignable Learners (Trainer/Admin)",
    description="Retrieve all active learners available for assessment assignment.",
)
def get_assignable_learners(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> List[AssignableLearnerResponse]:
    """List learners available to receive assessment assignments."""
    return AssessmentService.get_assignable_learners(db=db, current_user=current_user)


@router.get(
    "/{assessment_id}",
    response_model=AssessmentDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Assessment Details",
    description="Get assessment details and questions. For learners, answers and explanations are omitted.",
)
def get_assessment_detail(
    assessment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssessmentDetailResponse:
    """Retrieve assessment details and its questions with appropriate role sanitization."""
    assessment = AssessmentService.get_assessment(db=db, assessment_id=assessment_id)
    role_name = current_user.role.name if current_user.role else ""
    is_admin_or_trainer = role_name in {"ADMIN", "TRAINER"}

    if not is_admin_or_trainer:
        if assessment.status != "PUBLISHED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access unpublished assessments.",
            )
        assigned = (
            db.query(AssessmentAssignment)
            .filter(
                AssessmentAssignment.assessment_id == assessment_id,
                AssessmentAssignment.user_id == current_user.id,
            )
            .first()
        )
        if not assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this official assessment.",
            )

    questions = AssessmentService.get_assessment_questions(db=db, assessment_id=assessment.id)

    formatted_questions: list = []
    if is_admin_or_trainer:
        for q in questions:
            formatted_questions.append(
                QuestionAdminResponse(
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
                    correct_option=q.correct_option,
                    explanation=q.explanation,
                    points=q.points,
                    sequence_order=q.sequence_order,
                    created_at=q.created_at,
                    updated_at=q.updated_at,
                )
            )
    else:
        for q in questions:
            formatted_questions.append(
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
            )

    return AssessmentDetailResponse(
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
        questions=formatted_questions,
    )


@router.put(
    "/{assessment_id}",
    response_model=AssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Assessment (Trainer/Admin)",
    description="Update assessment metadata.",
)
def update_assessment(
    assessment_id: uuid.UUID,
    assessment_in: AssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> AssessmentResponse:
    """Update assessment metadata."""
    assessment = AssessmentService.update_assessment(
        db=db,
        assessment_id=assessment_id,
        assessment_in=assessment_in,
        current_user=current_user,
    )
    return AssessmentResponse(
        id=assessment.id,
        title=assessment.title,
        description=assessment.description,
        instructions=assessment.instructions,
        duration_minutes=assessment.duration_minutes,
        difficulty=assessment.difficulty,
        status=assessment.status,
        question_count=len(assessment.questions),
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
    )


@router.delete(
    "/{assessment_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Assessment (Trainer/Admin)",
    description="Delete an assessment if no attempts exist.",
)
def delete_assessment(
    assessment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> dict:
    """Delete an assessment."""
    AssessmentService.delete_assessment(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user,
    )
    return {"message": "Assessment deleted successfully."}


@router.post(
    "/{assessment_id}/assign",
    response_model=AssessmentAssignResult,
    status_code=status.HTTP_200_OK,
    summary="Assign Assessment to Learners (Trainer/Admin)",
    description="Assign a published assessment to selected learners, preventing duplicates.",
)
def assign_assessment(
    assessment_id: uuid.UUID,
    assign_in: AssessmentAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> AssessmentAssignResult:
    """Assign an official published assessment to one or more learners."""
    return AssessmentService.assign_assessment(
        db=db,
        assessment_id=assessment_id,
        assign_in=assign_in,
        current_user=current_user,
    )


@router.get(
    "/{assessment_id}/assignments",
    response_model=List[AssessmentAssignmentResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Assessment Assignments (Trainer/Admin)",
    description="Retrieve existing learner assignments for a published assessment.",
)
def get_assessment_assignments(
    assessment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
) -> List[AssessmentAssignmentResponse]:
    """Retrieve all learner assignments for an assessment."""
    return AssessmentService.get_assessment_assignments(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user,
    )

