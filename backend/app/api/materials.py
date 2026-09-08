"""Learning Material Knowledge Approval and Vector Indexing API Router."""

import logging
import uuid
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.database.session import get_db
from app.models.learning_material import LearningMaterial
from app.models.user import User
from app.schemas.assistant import MaterialIndexResponse, MaterialIndexStatusResponse
from app.services.document_indexing_service import DocumentIndexingService

logger = logging.getLogger("competiq.api.materials")

router = APIRouter(prefix="/materials", tags=["Document Indexing"])


def _check_material_ownership(material_id: uuid.UUID, current_user: User, db: Session) -> LearningMaterial:
    """Validate material exists and current_user has trainer/admin privileges."""
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning material '{material_id}' not found.",
        )
    user_role = current_user.role.name if current_user.role else ""
    if user_role != "ADMIN" and material.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage this learning material.",
        )
    return material


@router.post(
    "/{material_id}/approve",
    status_code=status.HTTP_200_OK,
    summary="Approve Learning Material",
    description="Mark processed learning material as approved for inclusion in the AI knowledge base.",
)
def approve_material(
    material_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Approve a learning material for indexing."""
    _check_material_ownership(material_id, current_user, db)
    mat = DocumentIndexingService.approve_learning_material(db=db, material_id=material_id)
    return {"message": f"Learning material '{mat.title}' successfully approved for RAG indexing."}


@router.post(
    "/{material_id}/index",
    response_model=MaterialIndexResponse,
    status_code=status.HTTP_200_OK,
    summary="Index Approved Material into Vector Store",
    description="Chunk and embed approved document text, storing vectors in ChromaDB and metadata in document_chunks.",
)
def index_material(
    material_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> MaterialIndexResponse:
    """Index approved document into ChromaDB."""
    _check_material_ownership(material_id, current_user, db)
    result = DocumentIndexingService.index_learning_material(db=db, material_id=material_id)
    return MaterialIndexResponse(**result)


@router.get(
    "/{material_id}/index-status",
    response_model=MaterialIndexStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Material Indexing Status",
    description="Inspect approval state and vector chunk count for a learning material.",
)
def get_material_index_status(
    material_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> MaterialIndexStatusResponse:
    """Check whether a document is approved and indexed."""
    _check_material_ownership(material_id, current_user, db)
    status_data = DocumentIndexingService.get_index_status(db=db, material_id=material_id)
    return MaterialIndexStatusResponse(**status_data)


@router.post(
    "/{material_id}/reindex",
    response_model=MaterialIndexResponse,
    status_code=status.HTTP_200_OK,
    summary="Re-index Learning Material",
    description="Purge existing vectors and re-chunk/re-embed approved learning material.",
)
def reindex_material(
    material_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> MaterialIndexResponse:
    """Re-index document into ChromaDB."""
    _check_material_ownership(material_id, current_user, db)
    result = DocumentIndexingService.index_learning_material(db=db, material_id=material_id)
    return MaterialIndexResponse(**result)
