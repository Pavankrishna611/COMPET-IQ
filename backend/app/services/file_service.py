"""File Service for secure document upload and file system operations."""

import logging
import os
import uuid
from pathlib import Path
from typing import Dict

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger("competiq.services.file")


class FileService:
    """Service handling secure file validation, UUID storage, and directory management."""

    @staticmethod
    def get_upload_dir() -> Path:
        """Resolve upload directory and ensure it exists."""
        upload_path = Path(settings.UPLOAD_DIR)
        upload_path.mkdir(parents=True, exist_ok=True)
        return upload_path

    @staticmethod
    def get_allowed_extensions() -> set:
        """Parse allowed document types into standard lowercase dot-prefixed extensions."""
        types = [t.strip().lower() for t in settings.ALLOWED_DOCUMENT_TYPES.split(",") if t.strip()]
        return {f".{t}" if not t.startswith(".") else t for t in types}

    @classmethod
    def is_allowed_file(cls, filename: str) -> bool:
        """Check whether a filename has an allowed extension."""
        if not filename:
            return False
        _, ext = os.path.splitext(filename.lower())
        return ext in cls.get_allowed_extensions()

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent directory traversal."""
        return os.path.basename(filename).strip()

    @classmethod
    async def save_upload_file(cls, file: UploadFile) -> Dict[str, any]:
        """Validate and securely persist an uploaded file.

        Returns a dictionary containing storage metadata.
        """
        if not file or not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No upload file provided.",
            )

        # 1. Sanitize original filename and extract extension
        raw_filename = os.path.basename(file.filename).strip()
        _, ext = os.path.splitext(raw_filename)
        ext = ext.lower()

        allowed_extensions = cls.get_allowed_extensions()
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file type '{ext}'. Allowed types: {sorted(list(allowed_extensions))}",
            )

        # 2. Generate secure UUID stored filename
        unique_id = uuid.uuid4()
        clean_file_type = ext.lstrip(".")
        stored_filename = f"{unique_id}{ext}"

        upload_dir = cls.get_upload_dir()
        target_path = upload_dir / stored_filename

        # 3. Stream content to disk and check file size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        total_bytes = 0

        try:
            with open(target_path, "wb") as buffer:
                while chunk := await file.read(1024 * 64):  # 64KB chunks
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        # Clean up partial file
                        buffer.close()
                        if target_path.exists():
                            target_path.unlink()
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds maximum allowable limit of {settings.MAX_UPLOAD_SIZE_MB}MB.",
                        )
                    buffer.write(chunk)
        except Exception as exc:
            if isinstance(exc, HTTPException):
                raise
            if target_path.exists():
                target_path.unlink()
            logger.error(f"Error saving upload file '{raw_filename}': {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save uploaded file to storage.",
            )

        # 4. Verify file is not empty
        if total_bytes == 0:
            if target_path.exists():
                target_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes).",
            )

        logger.info(f"Securely stored file '{raw_filename}' as '{stored_filename}' ({total_bytes} bytes)")

        return {
            "original_filename": raw_filename,
            "stored_filename": stored_filename,
            "file_path": str(target_path),
            "file_type": clean_file_type,
            "file_size": total_bytes,
        }

    @staticmethod
    def delete_stored_file(file_path: str) -> bool:
        """Safely delete a stored file from disk."""
        try:
            p = Path(file_path)
            if p.exists() and p.is_file():
                p.unlink()
                logger.info(f"Deleted physical file: {file_path}")
                return True
        except Exception as exc:
            logger.warning(f"Could not delete physical file at {file_path}: {exc}")
        return False

    # Convenience aliases
    save_uploaded_file = save_upload_file
