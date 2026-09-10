"""COMPETIQ Backend Application Entry Point."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.ai_assessments import router as ai_assessments_router
from app.api.analytics import router as analytics_router
from app.api.assessments import router as assessments_router
from app.api.assistant import router as assistant_router
from app.api.auth import router as auth_router
from app.api.competencies import router as competencies_router
from app.api.courses import router as courses_router
from app.api.health import router as health_router
from app.api.learning_paths import router as learning_paths_router
from app.api.materials import router as materials_router
from app.api.notifications import router as notifications_router
from app.api.onboarding import router as onboarding_router
from app.api.quiz import router as quiz_router
from app.api.recommendations import router as recommendations_router
from app.api.search import router as search_router
from app.api.skill_gaps import router as skill_gaps_router
from app.core.config import settings
from app.database.init_db import init_db

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("competiq")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application startup and shutdown lifecycle events."""
    logger.info("Starting COMPETIQ API backend...")
    # Initialize database tables and seed default roles, competencies, and requirements on startup
    init_db(raise_on_error=False)
    yield
    logger.info("Shutting down COMPETIQ API backend...")


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for the COMPETIQ Intelligent Competency and Personalized Learning Platform.",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# -----------------------------------------------------------------------------
# CORS Configuration
# -----------------------------------------------------------------------------
# Parse allowed origins from environment configuration
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Global Error Handling
# -----------------------------------------------------------------------------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle standard HTTP exceptions with uniform JSON output."""
    headers = getattr(exc, "headers", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
            }
        },
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle validation errors with detailed, clean formatting."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "message": "Validation error in request parameters",
                "details": jsonable_encoder(exc.errors()),
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle uncaught exceptions without exposing stack traces in production."""
    logger.error(
        f"Unhandled error processing request {request.method} {request.url}: {exc}",
        exc_info=settings.DEBUG,
    )
    message = str(exc) if settings.DEBUG else "An unexpected internal server error occurred."
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "message": message,
            }
        },
    )


# -----------------------------------------------------------------------------
# Root Endpoint
# -----------------------------------------------------------------------------
@app.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Root Endpoint",
    description="Welcome message and pointer to API documentation.",
    tags=["Root"],
)
async def root() -> Dict[str, str]:
    """Root endpoint welcoming users to the COMPETIQ API."""
    return {
        "message": "Welcome to COMPETIQ API",
        "docs": "/docs",
    }


@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Root Service Health Check",
    description="Returns operational status and version info for platform health checks.",
    tags=["Health"],
)
async def root_health_check() -> Dict[str, str]:
    """Lightweight unauthenticated health check endpoint."""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# -----------------------------------------------------------------------------
# API v1 Router Registration
# -----------------------------------------------------------------------------
API_V1_PREFIX = "/api/v1"

# Modular routers
app.include_router(health_router, prefix=API_V1_PREFIX)
app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(competencies_router, prefix=API_V1_PREFIX)
app.include_router(skill_gaps_router, prefix=API_V1_PREFIX)
app.include_router(courses_router, prefix=API_V1_PREFIX)
app.include_router(recommendations_router, prefix=API_V1_PREFIX)
app.include_router(learning_paths_router, prefix=API_V1_PREFIX)
app.include_router(onboarding_router, prefix=API_V1_PREFIX)
app.include_router(assessments_router, prefix=API_V1_PREFIX)
app.include_router(notifications_router, prefix=API_V1_PREFIX)
app.include_router(quiz_router, prefix=API_V1_PREFIX)
app.include_router(ai_assessments_router, prefix=API_V1_PREFIX)
app.include_router(assistant_router, prefix=API_V1_PREFIX)
app.include_router(materials_router, prefix=API_V1_PREFIX)
app.include_router(analytics_router, prefix=API_V1_PREFIX)
app.include_router(search_router, prefix=API_V1_PREFIX)
