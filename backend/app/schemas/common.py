"""Common and reusable Pydantic schemas."""

from typing import Any, Optional

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Standard generic message response schema."""

    message: str


class HealthResponse(BaseModel):
    """Health check response payload schema."""

    status: str
    service: str
    version: str


class ErrorDetail(BaseModel):
    """Detailed error object representation."""

    code: int
    message: str
    details: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Standard uniform error response envelope."""

    error: ErrorDetail
