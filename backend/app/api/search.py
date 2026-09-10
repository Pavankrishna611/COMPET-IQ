"""Unified global search API endpoint."""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.search import SearchResponse
from app.services.search_service import search_service

router = APIRouter(prefix="/search", tags=["Search"])


@router.get(
    "",
    response_model=SearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Global Unified Search",
    description="Search across courses, competencies, assessments, learning paths, and resources with role-aware security and relevance scoring.",
)
def global_search(
    q: str = Query(
        "",
        description="Search query string (case-insensitive, auto-trimmed)",
    ),
    category: Optional[str] = Query(
        None,
        description="Filter by specific category: course, competency, assessment, learning_path, material",
    ),
    limit: int = Query(
        20,
        ge=1,
        le=50,
        description="Maximum number of search results to return",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SearchResponse:
    """Execute global search against platform data."""
    return search_service.search(
        db=db,
        query=q,
        current_user=current_user,
        category_filter=category,
        limit=limit,
    )
