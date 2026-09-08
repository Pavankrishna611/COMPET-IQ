"""Automated test suite for Backend Part 7: AI Assessment Generator + Document Processing."""

import io
import sys
import uuid
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup path
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.security import create_access_token, hash_password
from app.database.base import Base
from app.database.init_db import seed_database_data
from app.database.session import get_db
from app.main import app
from app.models.assessment import Assessment
from app.models.competency import Competency
from app.models.generated_question import GeneratedQuestion
from app.models.learning_material import LearningMaterial
from app.models.question import Question
from app.models.role import Role
from app.models.user import User
from app.services.content_analysis_service import ContentAnalysisService
from app.services.document_service import DocumentService
from app.services.file_service import FileService
from app.services.question_generation_service import MockLLMProvider, QuestionGenerationService
from app.services.question_validation_service import QuestionValidationService

# In-memory SQLite engine for testing
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def setup_module():
    """Create in-memory SQLite schema and seed standard reference data."""
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as session:
        seed_database_data(db_session=session)


# -----------------------------------------------------------------------------
# Test 1: Content Analysis & Document Extraction
# -----------------------------------------------------------------------------

SAMPLE_DOCUMENT_TEXT = """
Statistical Sampling Methodology and Data Validation Standards

Chapter 1: Principles of Stratified Sampling
In modern survey administration, stratified random sampling divides a population into homogeneous subgroups called strata before sampling. This approach minimizes sampling variance, enhances the precision of subpopulation estimators, and ensures adequate representation of critical demographic segments.

Key procedures during data validation:
1. Systematic outlier identification and range checks.
2. Cross-table consistency verifications.
3. Imputation of missing observations using verified donor records.
4. Evaluation of survey weights to correct for non-response bias.

Adherence to rigorous statistical standards guarantees reproducibility, comparability, and institutional credibility across continuous reporting cycles.
"""


def test_part7_document_service_and_content_analysis():
    """Verify document text normalization, statistical analysis, and topic extraction."""
    print("\n--- 1. Testing Document Extraction & Content Analysis Services ---")

    # 1. Text normalization
    raw_messy_text = "  Leading   whitespace\r\n\r\n\r\n\r\nMultiple blank lines.   \tTabbed text.\n"
    cleaned = DocumentService.clean_text(raw_messy_text)
    assert "Multiple blank lines." in cleaned
    assert "\r" not in cleaned
    assert "\n\n\n" not in cleaned

    # 2. Content analysis heuristics
    analysis = ContentAnalysisService.analyze_content(SAMPLE_DOCUMENT_TEXT)
    assert analysis["word_count"] > 50
    assert analysis["character_count"] > 300
    assert analysis["estimated_reading_minutes"] >= 1
    assert "Sampling" in analysis["topics"] or "Statistics" in analysis["topics"] or "Data Quality" in analysis["topics"]
    assert any(k in ["sample", "sampling", "data", "statistical", "validation", "estimator"] for k in analysis["keywords"])

    # 3. Paragraph-aware chunking
    chunks = ContentAnalysisService.chunk_content_for_generation(SAMPLE_DOCUMENT_TEXT, max_chunk_chars=500)
    assert len(chunks) >= 1
    for chunk in chunks:
        assert len(chunk) <= 600

    print("Document normalization and content analysis heuristics verified.")


# -----------------------------------------------------------------------------
# Test 2: File Service Security & Storage
# -----------------------------------------------------------------------------

def test_part7_file_service_security():
    """Verify file security: allowed extensions, sanitization, and size limits."""
    print("\n--- 2. Testing File Service Security & Storage ---")

    # 1. Extension checking
    assert FileService.is_allowed_file("report.pdf") is True
    assert FileService.is_allowed_file("training.docx") is True
    assert FileService.is_allowed_file("presentation.pptx") is True
    assert FileService.is_allowed_file("notes.txt") is True
    assert FileService.is_allowed_file("malicious.exe") is False
    assert FileService.is_allowed_file("script.py") is False
    assert FileService.is_allowed_file("archive.zip") is False

    # 2. Path sanitization
    sanitized = FileService.sanitize_filename("../../etc/passwd.txt")
    assert "/" not in sanitized
    assert "\\" not in sanitized
    assert "passwd.txt" in sanitized

    print("File service security constraints verified.")


# -----------------------------------------------------------------------------
# Test 3: Question Validation Service & Duplicate Detection
# -----------------------------------------------------------------------------

def test_part7_question_validation_and_duplicate_detection():
    """Verify psychometric question validation rules and duplicate detection."""
    print("\n--- 3. Testing Question Validation & Duplicate Detection ---")

    # 1. Valid question
    valid_q = {
        "question_text": "What is the primary benefit of stratified random sampling in survey research?",
        "option_a": "It minimizes sampling variance and ensures proportional representation of strata.",
        "option_b": "It eliminates the need for calculating sample weights.",
        "option_c": "It automatically imputes all missing categorical values.",
        "option_d": "It reduces questionnaire response time by 90 percent.",
        "correct_option": "A",
        "explanation": "Stratified sampling divides heterogeneous populations into homogeneous strata, decreasing overall sampling error.",
    }
    res = QuestionValidationService.validate_generated_question(valid_q)
    assert res["is_valid"] is True
    assert len(res["errors"]) == 0

    # 2. Invalid questions: identical options, invalid correct option, short text
    invalid_q1 = {
        **valid_q,
        "option_b": "It minimizes sampling variance and ensures proportional representation of strata.",  # duplicate of A
    }
    res1 = QuestionValidationService.validate_generated_question(invalid_q1)
    assert res1["is_valid"] is False
    assert any("identical" in err.lower() for err in res1["errors"])

    invalid_q2 = {
        **valid_q,
        "correct_option": "E",  # invalid
    }
    res2 = QuestionValidationService.validate_generated_question(invalid_q2)
    assert res2["is_valid"] is False
    assert any("Must be A, B, C, or D" in err for err in res2["errors"])

    # 3. Duplicate detection across pool
    pool = [
        valid_q,
        {
            "question_text": "What is the primary benefit of stratified random sampling in survey research?",  # exact duplicate
            "option_a": "Option A",
            "option_b": "Option B",
            "option_c": "Option C",
            "option_d": "Option D",
            "correct_option": "A",
            "explanation": "Explanation",
        },
    ]
    warnings = QuestionValidationService.detect_duplicates(pool)
    assert len(warnings) > 0
    assert "Potential redundancy" in warnings[0]

    print("Question validation rules and duplicate detection verified.")


# -----------------------------------------------------------------------------
# Test 4: Mock LLM Provider Question Synthesis
# -----------------------------------------------------------------------------

def test_part7_mock_llm_provider_generation():
    """Verify deterministic mock LLM synthesis fallback."""
    print("\n--- 4. Testing Mock LLM Provider Generation ---")

    provider = MockLLMProvider(
        material_title="Survey Sampling Guide",
        topics=["Sampling Methods", "Data Quality"],
        keywords=["sampling", "strata", "variance", "imputation"],
    )
    output = provider.generate(
        system_prompt="You are an expert psychometrician.",
        user_prompt="Generate 5 questions for competency assessment. Difficulty: MEDIUM",
    )
    questions = QuestionGenerationService.parse_llm_json(output)
    assert len(questions) == 5
    for q in questions:
        assert "question_text" in q
        assert q["correct_option"] in ["A", "B", "C", "D"]
        assert len(q["option_a"]) > 0
        assert len(q["option_b"]) > 0
        assert len(q["option_c"]) > 0
        assert len(q["option_d"]) > 0
        val = QuestionValidationService.validate_generated_question(q)
        assert val["is_valid"] is True, f"Mock generated question invalid: {val['errors']}"

    print("Mock LLM generation synthesizes high-quality validated questions.")


# -----------------------------------------------------------------------------
# Test 5: Full API Integration Test
# -----------------------------------------------------------------------------

def test_part7_api_upload_generation_review_and_assessment_creation():
    """Full lifecycle: Upload -> Analysis -> Generate -> Review -> Create Assessment -> Publish & Take Quiz."""
    print("\n--- 5. Testing Full AI Assessment Workflow via API Endpoints ---")

    with TestingSessionLocal() as session:
        trainer_role = session.query(Role).filter(Role.name == "TRAINER").first()
        learner_role = session.query(Role).filter(Role.name == "LEARNER").first()
        comp = session.query(Competency).filter(Competency.code == "STAT_SAMPLING").first()

        trainer = session.query(User).filter(User.official_id == "TR-701").first()
        if not trainer:
            trainer = User(
                official_id="TR-701",
                email="trainer701@competiq.org",
                full_name="AI Assessment Trainer",
                password_hash=hash_password("TrainerPass123!"),
                role_id=trainer_role.id,
                is_active=True,
            )
            session.add(trainer)

        learner = session.query(User).filter(User.official_id == "LR-702").first()
        if not learner:
            learner = User(
                official_id="LR-702",
                email="learner702@competiq.org",
                full_name="Assessment Test Learner",
                password_hash=hash_password("LearnerPass123!"),
                role_id=learner_role.id,
                is_active=True,
            )
            session.add(learner)

        session.commit()
        session.refresh(trainer)
        session.refresh(learner)

        trainer_id = trainer.id
        learner_id = learner.id
        comp_id = comp.id

    trainer_token = create_access_token(subject=str(trainer_id), role="TRAINER")
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    learner_token = create_access_token(subject=str(learner_id), role="LEARNER")
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # 1. Non-trainer / learner upload attempt -> 403 Forbidden
    file_bytes = SAMPLE_DOCUMENT_TEXT.encode("utf-8")
    res = client.post(
        "/api/v1/ai-assessments/materials/upload",
        files={"file": ("sampling_guide.txt", io.BytesIO(file_bytes), "text/plain")},
        data={"title": "Unauthorized Upload"},
        headers=learner_headers,
    )
    assert res.status_code == 403, f"Expected 403 for learner upload, got {res.status_code}"

    # 2. Trainer uploads educational document -> 201 Created
    res = client.post(
        "/api/v1/ai-assessments/materials/upload",
        files={"file": ("sampling_guide.txt", io.BytesIO(file_bytes), "text/plain")},
        data={"title": "Official Statistical Sampling Guide", "competency_id": str(comp_id)},
        headers=trainer_headers,
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    mat_data = res.json()
    material_id = mat_data["id"]
    assert mat_data["status"] == "PROCESSED"
    assert mat_data["file_type"] == "txt"
    print(f"Material successfully uploaded & processed: ID={material_id}")

    # 3. List materials with filters
    res = client.get("/api/v1/ai-assessments/materials?file_type=txt", headers=trainer_headers)
    assert res.status_code == 200
    materials_list = res.json()
    assert len(materials_list) >= 1
    assert any(m["id"] == material_id for m in materials_list)

    # 4. Content Analysis Endpoint
    res = client.get(f"/api/v1/ai-assessments/materials/{material_id}/analysis", headers=trainer_headers)
    assert res.status_code == 200
    analysis_data = res.json()
    assert analysis_data["word_count"] > 50
    assert len(analysis_data["topics"]) > 0
    assert len(analysis_data["keywords"]) > 0
    print(f"Extracted Analysis: Words={analysis_data['word_count']}, Topics={analysis_data['topics']}")

    # 5. Generate Assessment Questions (Mock mode fallback)
    res = client.post(
        "/api/v1/ai-assessments/generate",
        json={
            "material_id": material_id,
            "number_of_questions": 5,
            "difficulty": "MEDIUM",
            "question_type": "MCQ",
            "competency_id": str(comp_id),
            "language": "English",
        },
        headers=trainer_headers,
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    gen_result = res.json()
    assert gen_result["generation_mode"] == "MOCK"
    assert gen_result["generated_count"] == 5
    staged_questions = gen_result["questions"]
    assert len(staged_questions) == 5
    q1_id = staged_questions[0]["id"]
    q2_id = staged_questions[1]["id"]
    q3_id = staged_questions[2]["id"]
    q4_id = staged_questions[3]["id"]
    q5_id = staged_questions[4]["id"]
    print(f"Generated 5 staged questions in {gen_result['generation_mode']} mode.")

    # 6. List Staged Questions for Review
    res = client.get(f"/api/v1/ai-assessments/materials/{material_id}/questions", headers=trainer_headers)
    assert res.status_code == 200
    assert len(res.json()) == 5

    # 7. Trainer Edits a Question -> status EDITED
    res = client.put(
        f"/api/v1/ai-assessments/questions/{q1_id}",
        json={
            "question_text": "Updated Question: What is the core purpose of stratified survey design?",
            "option_a": "To ensure precision across critical population strata.",
            "option_b": "To bypass the need for questionnaire design.",
            "option_c": "To convert survey responses into uncompressed images.",
            "option_d": "To avoid calculating weights during estimation.",
            "correct_option": "A",
            "explanation": "Stratified sampling improves precision across specific subpopulations.",
        },
        headers=trainer_headers,
    )
    assert res.status_code == 200
    updated_q = res.json()
    assert updated_q["generation_status"] == "EDITED"
    assert updated_q["validation_status"] == "VALID"
    assert "Updated Question" in updated_q["question_text"]

    # 8. Trainer Approves Valid Questions
    res = client.post(f"/api/v1/ai-assessments/questions/{q1_id}/approve", headers=trainer_headers)
    assert res.status_code == 200
    assert res.json()["generation_status"] == "APPROVED"

    res = client.post(f"/api/v1/ai-assessments/questions/{q2_id}/approve", headers=trainer_headers)
    assert res.status_code == 200
    assert res.json()["generation_status"] == "APPROVED"

    res = client.post(f"/api/v1/ai-assessments/questions/{q3_id}/approve", headers=trainer_headers)
    assert res.status_code == 200
    assert res.json()["generation_status"] == "APPROVED"

    # 9. Trainer Rejects One Question
    res = client.post(f"/api/v1/ai-assessments/questions/{q4_id}/reject", headers=trainer_headers)
    assert res.status_code == 200
    assert res.json()["generation_status"] == "REJECTED"

    # 10. Trainer Regenerates a Question
    res = client.post(f"/api/v1/ai-assessments/questions/{q5_id}/regenerate", headers=trainer_headers)
    assert res.status_code == 201
    replacement_q = res.json()
    replacement_id = replacement_q["id"]
    assert replacement_id != q5_id
    assert replacement_q["generation_status"] == "GENERATED"
    print(f"Regenerated replacement question: ID={replacement_id}")

    # Approve replacement question
    res = client.post(f"/api/v1/ai-assessments/questions/{replacement_id}/approve", headers=trainer_headers)
    assert res.status_code == 200

    # 11. Attempt to create assessment with an unapproved question (q4 is REJECTED) -> 400 Bad Request
    res = client.post(
        "/api/v1/ai-assessments/create-assessment",
        json={
            "title": "Invalid Assessment Attempt",
            "generated_question_ids": [q1_id, q2_id, q4_id],
        },
        headers=trainer_headers,
    )
    assert res.status_code == 400
    assert "must have APPROVED status" in res.json()["error"]["message"]

    # 12. Create official Assessment from approved questions (q1, q2, q3, replacement)
    res = client.post(
        "/api/v1/ai-assessments/create-assessment",
        json={
            "title": "AI Generated Sampling Standards Evaluation",
            "description": "Assessment generated from official statistical sampling reference material.",
            "instructions": "Answer all 4 questions carefully.",
            "duration_minutes": 25,
            "difficulty": "INTERMEDIATE",
            "generated_question_ids": [q1_id, q2_id, q3_id, replacement_id],
        },
        headers=trainer_headers,
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    created_assessment = res.json()
    ass_id = created_assessment["id"]
    assert created_assessment["status"] == "DRAFT"
    assert created_assessment["question_count"] == 4
    assert len(created_assessment["questions"]) == 4
    print(f"Official Part 6 Assessment created from approved AI questions: ID={ass_id} (Status=DRAFT)")

    # 13. Publish the Assessment via Part 6 endpoint
    res = client.post(f"/api/v1/assessments/{ass_id}/publish", headers=trainer_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "PUBLISHED"
    print("Assessment published to learner catalog.")

    # 14. Learner starts the quiz via Part 6 endpoint
    res = client.post(f"/api/v1/quiz/{ass_id}/start", headers=learner_headers)
    assert res.status_code == 200
    quiz_data = res.json()
    attempt_id = quiz_data["attempt_id"]
    questions_for_learner = quiz_data["questions"]
    assert len(questions_for_learner) == 4
    # Verify answers and explanations are stripped from learner view
    for lq in questions_for_learner:
        assert "correct_option" not in lq
        assert "explanation" not in lq

    # 15. Learner submits answers
    first_q_id = uuid.UUID(str(questions_for_learner[0]["id"]))
    with TestingSessionLocal() as session:
        target_q = session.query(Question).filter(Question.id == first_q_id).first()
        correct_ans = target_q.correct_option

    # Answer first question correctly
    res = client.post(
        f"/api/v1/quiz/attempts/{attempt_id}/answer",
        json={"question_id": str(first_q_id), "selected_option": correct_ans},
        headers=learner_headers,
    )
    assert res.status_code == 200

    # Submit quiz
    res = client.post(f"/api/v1/quiz/attempts/{attempt_id}/submit", headers=learner_headers)
    assert res.status_code == 200
    quiz_result = res.json()
    assert quiz_result["total_questions"] == 4
    assert quiz_result["correct_answers"] >= 1
    assert "competency_breakdown" in quiz_result
    assert len(quiz_result["competency_breakdown"]) >= 1
    print(f"Quiz completed successfully. Score: {quiz_result['score']} points, Correct: {quiz_result['correct_answers']}/{quiz_result['total_questions']} ({quiz_result['percentage']}%)")

    # 16. Verify RBAC: Trainer B cannot edit Trainer A's questions
    with TestingSessionLocal() as session:
        trainer_role = session.query(Role).filter(Role.name == "TRAINER").first()
        trainer_b = User(
            official_id="TR-999",
            email="trainer999@competiq.org",
            full_name="Second Trainer",
            password_hash=hash_password("TrainerPass123!"),
            role_id=trainer_role.id,
            is_active=True,
        )
        session.add(trainer_b)
        session.commit()
        trainer_b_id = trainer_b.id

    trainer_b_token = create_access_token(subject=str(trainer_b_id), role="TRAINER")
    trainer_b_headers = {"Authorization": f"Bearer {trainer_b_token}"}

    res = client.put(
        f"/api/v1/ai-assessments/questions/{q1_id}",
        json={"question_text": "Unauthorized alteration attempt"},
        headers=trainer_b_headers,
    )
    assert res.status_code == 403, f"Expected 403 Forbidden for Trainer B, got {res.status_code}"

    print("End-to-end integration flow and security boundaries successfully verified.")


if __name__ == "__main__":
    setup_module()
    test_part7_document_service_and_content_analysis()
    test_part7_file_service_security()
    test_part7_question_validation_and_duplicate_detection()
    test_part7_mock_llm_provider_generation()
    test_part7_api_upload_generation_review_and_assessment_creation()
    print("\n=======================================================")
    print("ALL PART 7 AI ASSESSMENT GENERATOR TESTS PASSED!")
    print("=======================================================")
