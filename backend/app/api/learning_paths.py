"""Personalized Learning Path management and progress tracking API endpoints."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.learning_path import (
    LearningPathGenerationResponse,
    LearningPathItemResponse,
    LearningPathItemUpdate,
    LearningPathResponse,
    WatchTimeStatsResponse,
)
from app.services.learning_path_service import learning_path_service

router = APIRouter(prefix="/learning-paths", tags=["Learning Paths"])


@router.get(
    "/watch-time",
    response_model=WatchTimeStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get User Watch Time and Learning Hours",
    description="Calculate and return the authenticated learner's real total watch time and module progress.",
)
def get_my_watch_time(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WatchTimeStatsResponse:
    """Return caller's real watch time and learning hours."""
    stats = learning_path_service.get_user_watch_time_stats(db, current_user.id)
    return WatchTimeStatsResponse(**stats)


@router.get(
    "/me",
    response_model=LearningPathResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current Active Learning Path",
    description="Retrieve the authenticated learner's currently active learning path and ordered modules.",
)
def get_my_active_learning_path(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LearningPathResponse:
    """Return caller's active learning path."""
    return learning_path_service.get_active_learning_path(db, current_user.id)



@router.post(
    "/generate",
    response_model=LearningPathGenerationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Personalized Learning Path",
    description="Generate a personalized, sequenced learning path addressing active competency gaps. Previous active path is automatically archived.",
)
def generate_learning_path(
    force: bool = Query(False, description="Force regenerate and archive previous active path"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LearningPathGenerationResponse:
    """Generate dynamic learning path."""
    return learning_path_service.generate_learning_path(db, current_user, force=force)


@router.patch(
    "/items/{item_id}",
    response_model=LearningPathItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Learning Path Step Status",
    description="Update progress status (NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED) for an individual learning step. Requires path ownership.",
)
def update_learning_path_item_status(
    item_id: UUID,
    update_in: LearningPathItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LearningPathItemResponse:
    """Update learning step progress status."""
    return learning_path_service.update_item_status(db, current_user, item_id, update_in.status)


@router.get(
    "/history",
    response_model=List[LearningPathResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Learning Path History",
    description="Retrieve all historical (archived, completed, active) learning paths for the authenticated user.",
)
def get_my_learning_path_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[LearningPathResponse]:
    """Return historical learning journeys."""
    return learning_path_service.get_learning_path_history(db, current_user.id)


@router.post(
    "/add-course/{course_id}",
    response_model=LearningPathItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Course to Learning Path",
    description="Add a recommended course to the learner's active learning path without creating duplicates.",
)
def add_course_to_learning_path(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LearningPathItemResponse:
    """Add course directly to user's active learning path."""
    return learning_path_service.add_course_to_learning_path(db, current_user, course_id)

