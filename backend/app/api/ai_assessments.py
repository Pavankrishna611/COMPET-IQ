"""AI Assessment Generator and Document Processing API Endpoints."""

import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.assessment import Assessment
from app.models.competency import Competency
from app.models.generated_question import GeneratedQuestion
from app.models.learning_material import LearningMaterial
from app.models.question import Question
from app.models.user import User
from app.schemas.ai_assessment import (
    CreateAssessmentFromApprovedRequest,
    GeneratedQuestionResponse,
    GeneratedQuestionsResponse,
    GeneratedQuestionUpdate,
    GenerateQuestionsRequest,
    LearningMaterialResponse,
    MaterialAnalysisResponse,
)
from app.schemas.assessment import AssessmentDetailResponse
from app.services.content_analysis_service import ContentAnalysisService
from app.services.document_service import DocumentService
from app.services.file_service import FileService
from app.services.question_generation_service import QuestionGenerationService
from app.services.question_validation_service import QuestionValidationService

logger = logging.getLogger("competiq.api.ai_assessments")

router = APIRouter(prefix="/ai-assessments", tags=["AI Assessment Generator"])


def _check_material_access(material: LearningMaterial, current_user: User) -> None:
    """Verify that current_user has permission to access the learning material."""
    user_role = current_user.role.name if current_user.role else ""
    if user_role != "ADMIN" and material.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this learning material.",
        )


def _check_question_access(question: GeneratedQuestion, current_user: User) -> None:
    """Verify that current_user has permission to access or modify the generated question."""
    user_role = current_user.role.name if current_user.role else ""
    if user_role != "ADMIN":
        uploaded_by = question.learning_material.uploaded_by if question.learning_material else None
        if uploaded_by != current_user.id and question.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this generated question.",
            )


# -----------------------------------------------------------------------------
# 1. Document Upload & Extraction
# -----------------------------------------------------------------------------

@router.post(
    "/materials/upload",
    response_model=LearningMaterialResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Learning Material",
    description="Upload a document (.pdf, .docx, .pptx, .txt), extract text, and stage it for question generation.",
)
async def upload_material(
    file: UploadFile = File(..., description="Document file to upload (.pdf, .docx, .pptx, .txt)"),
    title: Optional[str] = Form(None, description="Optional custom title for the material"),
    competency_id: Optional[uuid.UUID] = Form(None, description="Optional competency association"),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> LearningMaterialResponse:
    """Handle document upload, storage, and text extraction."""
    # 1. Validate and save file
    file_info = await FileService.save_uploaded_file(file)
    doc_title = title.strip() if title and title.strip() else file_info["original_filename"]

    # Verify competency exists if provided
    if competency_id:
        comp = db.query(Competency).filter(Competency.id == competency_id).first()
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target competency '{competency_id}' not found.",
            )

    # 2. Stage LearningMaterial record in database
    material = LearningMaterial(
        title=doc_title,
        original_filename=file_info["original_filename"],
        stored_filename=file_info["stored_filename"],
        file_type=file_info["file_type"],
        file_path=file_info["file_path"],
        file_size=file_info["file_size"],
        uploaded_by=current_user.id,
        status="PROCESSING",
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    # 3. Extract text content
    try:
        extracted = DocumentService.extract_text(file_info["file_path"], file_info["file_type"])
        material.extracted_text = extracted
        material.status = "PROCESSED"
        db.commit()
        db.refresh(material)
    except Exception as exc:
        logger.error(f"Text extraction failed for material {material.id}: {exc}")
        material.status = "FAILED"
        material.extraction_error = str(exc)
        db.commit()
        db.refresh(material)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from uploaded document: {str(exc)}",
        )

    return material


# -----------------------------------------------------------------------------
# 2. List & Inspect Learning Materials
# -----------------------------------------------------------------------------

@router.get(
    "/materials",
    response_model=List[LearningMaterialResponse],
    summary="List Learning Materials",
    description="List uploaded materials with filtering. Trainers view their materials; Admins view all.",
)
def list_materials(
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    status: Optional[str] = Query(None, description="Filter by status: PROCESSED, PROCESSING, FAILED"),
    file_type: Optional[str] = Query(None, description="Filter by file type: pdf, docx, pptx, txt"),
    search: Optional[str] = Query(None, description="Search by title substring"),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> List[LearningMaterialResponse]:
    """List learning materials with role-based scoping and filters."""
    query = db.query(LearningMaterial)

    user_role = current_user.role.name if current_user.role else ""
    if user_role != "ADMIN":
        query = query.filter(LearningMaterial.uploaded_by == current_user.id)

    if status:
        query = query.filter(LearningMaterial.status == status.upper())
    if file_type:
        query = query.filter(LearningMaterial.file_type == file_type.lower())
    if search:
        query = query.filter(LearningMaterial.title.ilike(f"%{search.strip()}%"))

    materials = query.order_by(LearningMaterial.created_at.desc()).offset(skip).limit(limit).all()
    return materials


@router.get(
    "/materials/{material_id}",
    response_model=LearningMaterialResponse,
    summary="Get Learning Material Details",
    description="Retrieve metadata for a specific learning material.",
)
def get_material(
    material_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> LearningMaterialResponse:
    """Retrieve learning material details."""
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning material '{material_id}' not found.",
        )
    _check_material_access(material, current_user)
    return material


@router.get(
    "/materials/{material_id}/analysis",
    response_model=MaterialAnalysisResponse,
    summary="Get Material Content Analysis",
    description="Retrieve extracted statistics, estimated reading time, topics, and technical keywords.",
)
def get_material_analysis(
    material_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> MaterialAnalysisResponse:
    """Analyze and return statistics and thematic keywords from material text."""
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning material '{material_id}' not found.",
        )
    _check_material_access(material, current_user)

    if material.status != "PROCESSED" or not material.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Learning material is not in PROCESSED status or contains no extracted text.",
        )

    analysis = ContentAnalysisService.analyze_content(material.extracted_text)
    return MaterialAnalysisResponse(
        material_id=material.id,
        word_count=analysis["word_count"],
        character_count=analysis["character_count"],
        estimated_reading_minutes=analysis["estimated_reading_minutes"],
        topics=analysis["topics"],
        keywords=analysis["keywords"],
    )


# -----------------------------------------------------------------------------
# 3. AI / Mock Question Generation
# -----------------------------------------------------------------------------

@router.post(
    "/generate",
    response_model=GeneratedQuestionsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Questions from Material",
    description="Synthesize assessment questions via AI or Mock fallback provider from document content.",
)
def generate_questions(
    payload: GenerateQuestionsRequest,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> GeneratedQuestionsResponse:
    """Generate assessment questions and stage them for review."""
    material = db.query(LearningMaterial).filter(LearningMaterial.id == payload.material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning material '{payload.material_id}' not found.",
        )
    _check_material_access(material, current_user)

    if payload.competency_id:
        comp = db.query(Competency).filter(Competency.id == payload.competency_id).first()
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target competency '{payload.competency_id}' not found.",
            )

    result = QuestionGenerationService.generate_questions_from_content(
        db=db,
        material=material,
        number_of_questions=payload.number_of_questions,
        difficulty=payload.difficulty,
        question_type=payload.question_type,
        competency_id=payload.competency_id,
        language=payload.language,
        current_user=current_user,
    )

    return GeneratedQuestionsResponse(**result)


# -----------------------------------------------------------------------------
# 4. Question Review, Staging, and Modification
# -----------------------------------------------------------------------------

@router.get(
    "/materials/{material_id}/questions",
    response_model=List[GeneratedQuestionResponse],
    summary="List Staged Generated Questions",
    description="Retrieve all staged questions generated from a learning material for review.",
)
def list_generated_questions(
    material_id: uuid.UUID,
    generation_status: Optional[str] = Query(None, description="GENERATED, APPROVED, REJECTED, EDITED"),
    validation_status: Optional[str] = Query(None, description="VALID, INVALID, PENDING"),
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> List[GeneratedQuestionResponse]:
    """List questions staged for review."""
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning material '{material_id}' not found.",
        )
    _check_material_access(material, current_user)

    query = db.query(GeneratedQuestion).filter(GeneratedQuestion.learning_material_id == material_id)
    if generation_status:
        query = query.filter(GeneratedQuestion.generation_status == generation_status.upper())
    if validation_status:
        query = query.filter(GeneratedQuestion.validation_status == validation_status.upper())

    return query.order_by(GeneratedQuestion.created_at.asc()).all()


@router.put(
    "/questions/{question_id}",
    response_model=GeneratedQuestionResponse,
    summary="Edit Staged Question",
    description="Edit question text, options, or correct answer. Automatically sets status to EDITED and re-validates.",
)
def update_generated_question(
    question_id: uuid.UUID,
    payload: GeneratedQuestionUpdate,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> GeneratedQuestionResponse:
    """Edit question content and re-evaluate validity."""
    question = db.query(GeneratedQuestion).filter(GeneratedQuestion.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generated question '{question_id}' not found.",
        )
    _check_question_access(question, current_user)

    if payload.question_text is not None:
        question.question_text = payload.question_text
    if payload.difficulty is not None:
        question.difficulty = payload.difficulty
    if payload.option_a is not None:
        question.option_a = payload.option_a
    if payload.option_b is not None:
        question.option_b = payload.option_b
    if payload.option_c is not None:
        question.option_c = payload.option_c
    if payload.option_d is not None:
        question.option_d = payload.option_d
    if payload.correct_option is not None:
        question.correct_option = payload.correct_option
    if payload.explanation is not None:
        question.explanation = payload.explanation
    if payload.competency_id is not None:
        comp = db.query(Competency).filter(Competency.id == payload.competency_id).first()
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competency '{payload.competency_id}' not found.",
            )
        question.competency_id = payload.competency_id

    # Re-evaluate validation
    validation_dict = {
        "question_text": question.question_text,
        "option_a": question.option_a,
        "option_b": question.option_b,
        "option_c": question.option_c,
        "option_d": question.option_d,
        "correct_option": question.correct_option,
        "explanation": question.explanation,
    }
    val_result = QuestionValidationService.validate_generated_question(validation_dict)
    question.validation_status = "VALID" if val_result["is_valid"] else "INVALID"
    question.generation_status = "EDITED"

    db.commit()
    db.refresh(question)
    return question


@router.delete(
    "/questions/{question_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Staged Question",
    description="Remove a generated question from the staging area.",
)
def delete_generated_question(
    question_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Delete a staged generated question."""
    question = db.query(GeneratedQuestion).filter(GeneratedQuestion.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generated question '{question_id}' not found.",
        )
    _check_question_access(question, current_user)

    db.delete(question)
    db.commit()
    return {"message": f"Generated question '{question_id}' deleted successfully."}


@router.post(
    "/questions/{question_id}/approve",
    response_model=GeneratedQuestionResponse,
    summary="Approve Staged Question",
    description="Mark a valid question as APPROVED for inclusion in an assessment.",
)
def approve_question(
    question_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> GeneratedQuestionResponse:
    """Approve a question after verifying its structural validity."""
    question = db.query(GeneratedQuestion).filter(GeneratedQuestion.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generated question '{question_id}' not found.",
        )
    _check_question_access(question, current_user)

    # Validate before approving
    validation_dict = {
        "question_text": question.question_text,
        "option_a": question.option_a,
        "option_b": question.option_b,
        "option_c": question.option_c,
        "option_d": question.option_d,
        "correct_option": question.correct_option,
        "explanation": question.explanation,
    }
    val_result = QuestionValidationService.validate_generated_question(validation_dict)
    if not val_result["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve invalid question: {', '.join(val_result['errors'])}",
        )

    question.validation_status = "VALID"
    question.generation_status = "APPROVED"
    db.commit()
    db.refresh(question)
    return question


@router.post(
    "/questions/{question_id}/reject",
    response_model=GeneratedQuestionResponse,
    summary="Reject Staged Question",
    description="Mark a generated question as REJECTED.",
)
def reject_question(
    question_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> GeneratedQuestionResponse:
    """Reject a question."""
    question = db.query(GeneratedQuestion).filter(GeneratedQuestion.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generated question '{question_id}' not found.",
        )
    _check_question_access(question, current_user)

    question.generation_status = "REJECTED"
    db.commit()
    db.refresh(question)
    return question


@router.post(
    "/questions/{question_id}/regenerate",
    response_model=GeneratedQuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Regenerate Question",
    description="Generate a fresh replacement question from the underlying source material.",
)
def regenerate_question(
    question_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> GeneratedQuestionResponse:
    """Synthesize a new question replacing an unsatisfactory generated item."""
    question = db.query(GeneratedQuestion).filter(GeneratedQuestion.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generated question '{question_id}' not found.",
        )
    _check_question_access(question, current_user)

    replacement = QuestionGenerationService.regenerate_question(
        db=db,
        question_id=question_id,
        current_user=current_user,
    )
    return replacement


# -----------------------------------------------------------------------------
# 5. Assessment Creation from Approved Questions
# -----------------------------------------------------------------------------

@router.post(
    "/create-assessment",
    response_model=AssessmentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Assessment from Approved Questions",
    description="Convert selected approved questions into an official Assessment (initially DRAFT).",
)
def create_assessment_from_approved(
    payload: CreateAssessmentFromApprovedRequest,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> AssessmentDetailResponse:
    """Create an official Assessment in DRAFT status from a set of approved staged questions."""
    # 1. Fetch requested questions
    questions = (
        db.query(GeneratedQuestion)
        .filter(GeneratedQuestion.id.in_(payload.generated_question_ids))
        .all()
    )

    if len(questions) != len(payload.generated_question_ids):
        found_ids = {q.id for q in questions}
        missing = [str(qid) for qid in payload.generated_question_ids if qid not in found_ids]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"The following generated question IDs were not found: {missing}",
        )

    # 2. Verify all questions are APPROVED and user has access
    unapproved_ids = []
    for q in questions:
        _check_question_access(q, current_user)
        if q.generation_status != "APPROVED":
            unapproved_ids.append(str(q.id))

    if unapproved_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"All questions must have APPROVED status to create an assessment. Unapproved IDs: {unapproved_ids}",
        )

    # 3. Create Assessment in DRAFT status
    assessment = Assessment(
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        instructions=payload.instructions.strip() if payload.instructions else None,
        duration_minutes=payload.duration_minutes,
        difficulty=payload.difficulty.strip().upper(),
        status="DRAFT",
        created_by=current_user.id,
    )
    db.add(assessment)
    db.flush()

    # 4. Transfer questions to official Question model
    created_questions: List[Question] = []
    for idx, gen_q in enumerate(questions, start=1):
        official_q = Question(
            assessment_id=assessment.id,
            competency_id=gen_q.competency_id,
            question_text=gen_q.question_text,
            question_type=gen_q.question_type,
            difficulty=gen_q.difficulty,
            option_a=gen_q.option_a,
            option_b=gen_q.option_b,
            option_c=gen_q.option_c,
            option_d=gen_q.option_d,
            correct_option=gen_q.correct_option,
            explanation=gen_q.explanation,
            points=1.0,
            sequence_order=idx,
        )
        db.add(official_q)
        created_questions.append(official_q)

        # Link generated question to created assessment
        gen_q.assessment_id = assessment.id

    db.commit()
    db.refresh(assessment)

    # Format detail response
    question_responses = []
    for q in assessment.questions:
        question_responses.append(
            {
                "id": q.id,
                "assessment_id": q.assessment_id,
                "competency_id": q.competency_id,
                "competency_name": q.competency.name if q.competency else None,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "difficulty": q.difficulty,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "correct_option": q.correct_option,
                "explanation": q.explanation,
                "points": q.points,
                "sequence_order": q.sequence_order,
                "created_at": q.created_at,
                "updated_at": q.updated_at,
            }
        )

    return AssessmentDetailResponse(
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
        questions=question_responses,
    )


# -----------------------------------------------------------------------------
# 6. Material Approval and Vector Indexing Pipeline
# -----------------------------------------------------------------------------

@router.post(
    "/materials/{material_id}/approve",
    status_code=status.HTTP_200_OK,
    summary="Approve Learning Material",
    description="Mark processed learning material as approved for knowledge base indexing.",
)
def approve_material_endpoint(
    material_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Approve a learning material for RAG knowledge indexing."""
    from app.services.document_indexing_service import DocumentIndexingService

    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning material '{material_id}' not found.",
        )
    _check_material_access(material, current_user)
    mat = DocumentIndexingService.approve_learning_material(db=db, material_id=material_id)
    return {"message": f"Learning material '{mat.title}' successfully approved for RAG indexing."}


@router.post(
    "/materials/{material_id}/index",
    status_code=status.HTTP_200_OK,
    summary="Index Approved Learning Material",
    description="Chunk, embed, and persist vectors in ChromaDB and document_chunks in relational database.",
)
def index_material_endpoint(
    material_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Index approved learning material into vector store."""
    from app.services.document_indexing_service import DocumentIndexingService

    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning material '{material_id}' not found.",
        )
    _check_material_access(material, current_user)
    return DocumentIndexingService.index_learning_material(db=db, material_id=material_id)


@router.get(
    "/materials/{material_id}/index-status",
    status_code=status.HTTP_200_OK,
    summary="Get Material Indexing Status",
    description="Check vector count and approval status of a learning material.",
)
def get_index_status_endpoint(
    material_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Inspect whether a document is approved and indexed."""
    from app.services.document_indexing_service import DocumentIndexingService

    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning material '{material_id}' not found.",
        )
    _check_material_access(material, current_user)
    return DocumentIndexingService.get_index_status(db=db, material_id=material_id)


@router.post(
    "/materials/{material_id}/reindex",
    status_code=status.HTTP_200_OK,
    summary="Re-index Learning Material",
    description="Purge existing vectors and re-chunk/re-embed approved document.",
)
def reindex_material_endpoint(
    material_id: uuid.UUID,
    current_user: User = Depends(require_roles("TRAINER", "ADMIN")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Re-index approved document."""
    from app.services.document_indexing_service import DocumentIndexingService

    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning material '{material_id}' not found.",
        )
    _check_material_access(material, current_user)
    return DocumentIndexingService.index_learning_material(db=db, material_id=material_id)
