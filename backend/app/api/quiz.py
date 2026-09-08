"""Quiz and Assessment Attempt Endpoints.

Handles starting tests, saving answers in progress, submitting for evaluation, and retrieving results.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.quiz import (
    QuestionAnswerSubmit,
    QuizActiveResponse,
    QuizResultResponse,
    QuizStartResponse,
    QuizSubmitRequest,
    UserAttemptHistoryItem,
)
from app.services.quiz_service import QuizService

router = APIRouter(
    prefix="/quiz",
    tags=["Quiz"],
)


@router.get(
    "/my-attempts",
    response_model=List[UserAttemptHistoryItem],
    status_code=status.HTTP_200_OK,
    summary="Get My Assessment History",
    description="Retrieve all past and active assessment attempts for the authenticated user.",
)
def get_my_attempts(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by attempt status (IN_PROGRESS, EVALUATED)"),
    assessment_id: Optional[uuid.UUID] = Query(None, description="Filter by assessment ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[UserAttemptHistoryItem]:
    """Retrieve personal assessment attempt history."""
    return QuizService.get_user_attempts(
        db=db,
        user_id=current_user.id,
        status_filter=status_filter,
        assessment_id=assessment_id,
    )


@router.post(
    "/{assessment_id}/start",
    response_model=QuizStartResponse,
    status_code=status.HTTP_200_OK,
    summary="Start or Resume Quiz Attempt",
    description="Begin an assessment attempt or resume an active session. Learner-safe questions are returned.",
)
def start_quiz(
    assessment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizStartResponse:
    """Start or resume a quiz attempt."""
    return QuizService.start_quiz(
        db=db,
        user_id=current_user.id,
        assessment_id=assessment_id,
    )


@router.get(
    "/attempts/{attempt_id}",
    response_model=QuizActiveResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Active Quiz Attempt",
    description="Fetch current in-progress attempt state, questions, and already saved answers.",
)
def get_active_quiz(
    attempt_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizActiveResponse:
    """Retrieve active attempt."""
    return QuizService.get_active_quiz(
        db=db,
        user_id=current_user.id,
        attempt_id=attempt_id,
    )


@router.post(
    "/attempts/{attempt_id}/answer",
    status_code=status.HTTP_200_OK,
    summary="Save Question Answer",
    description="Save or update a selected option for a question in an in-progress attempt.",
)
def save_answer(
    attempt_id: uuid.UUID,
    answer_in: QuestionAnswerSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Save an individual answer option."""
    QuizService.save_answer(
        db=db,
        user_id=current_user.id,
        attempt_id=attempt_id,
        question_id=answer_in.question_id,
        selected_option=answer_in.selected_option,
    )
    return {"message": "Answer saved successfully."}


@router.post(
    "/attempts/{attempt_id}/submit",
    response_model=QuizResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit Quiz for Evaluation",
    description="Submit all answers, evaluate score, update competency profile, and unlock review.",
)
def submit_quiz(
    attempt_id: uuid.UUID,
    submit_req: Optional[QuizSubmitRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizResultResponse:
    """Submit quiz attempt."""
    submitted_answers = submit_req.answers if submit_req else None
    return QuizService.submit_quiz(
        db=db,
        user_id=current_user.id,
        attempt_id=attempt_id,
        submitted_answers=submitted_answers,
    )


@router.get(
    "/attempts/{attempt_id}/result",
    response_model=QuizResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Quiz Results & Review",
    description="View overall score, percentage, competency breakdown, and question review after submission.",
)
def get_quiz_result(
    attempt_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizResultResponse:
    """Retrieve results for an evaluated attempt."""
    return QuizService.get_quiz_result(
        db=db,
        attempt_id=attempt_id,
        current_user=current_user,
    )
