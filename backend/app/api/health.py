"""Health check router for the COMPETIQ API."""

from fastapi import APIRouter, status

from app.core.config import settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
    description="Returns operational status and version information for the COMPETIQ API.",
)
async def health_check() -> HealthResponse:
    """Return health status of the API."""
    return HealthResponse(
        status="healthy",
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
    )
