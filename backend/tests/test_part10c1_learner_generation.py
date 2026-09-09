"""Automated test suite for Part 10C-1: Connect Learner Material to AI Generation.

Verifies:
1. Own material succeeds: Learner generates practice MCQs from their own uploaded material.
2. Question structure: Each question contains question_text, options, correct_option, explanation, difficulty, topic.
3. Other learner's material is rejected: Learner 2 cannot generate MCQs from Learner 1's material (HTTP 403).
4. Invalid material ID is rejected: Non-existent material UUID returns HTTP 404.
5. Generated questions are validated: Questions adhere to strict QuestionValidationService rules.
6. Question count is respected: 5, 10, and 15 counts succeed; invalid count (e.g. 7) returns HTTP 422.
7. Official immutability: Practice question generation does NOT modify user_competencies or create official assessments.
"""

import io
import sys
import uuid
from pathlib import Path

from fastapi.testclient import TestClient
from pypdf import PageObject, PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

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
from app.models.learning_material import LearningMaterial
from app.models.role import Role
from app.models.user import User
from app.models.user_competency import UserCompetency
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

# Global test state
state = {}


def create_minimal_pdf_bytes(text_content: str = "National Accounts Statistics and Sampling Methodology") -> bytes:
    """Create valid PDF binary with extractable text."""
    writer = PdfWriter()
    page = PageObject.create_blank_page(width=612, height=792)

    font = DictionaryObject()
    font[NameObject("/Type")] = NameObject("/Font")
    font[NameObject("/Subtype")] = NameObject("/Type1")
    font[NameObject("/BaseFont")] = NameObject("/Helvetica")

    fonts = DictionaryObject()
    fonts[NameObject("/F1")] = font

    resources = DictionaryObject()
    resources[NameObject("/Font")] = fonts
    page[NameObject("/Resources")] = resources

    content_stream = f"BT /F1 12 Tf 72 712 Td ({text_content}) Tj ET".encode("latin-1")
    stream_obj = DecodedStreamObject()
    stream_obj.set_data(content_stream)
    page[NameObject("/Contents")] = stream_obj

    writer.add_page(page)

    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def setup_test_environment():
    """Create in-memory SQLite schema and seed standard reference users."""
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as session:
        seed_database_data(session)

        # Ensure LEARNER role
        learner_role = session.query(Role).filter(Role.name == "LEARNER").first()
        if not learner_role:
            learner_role = Role(name="LEARNER", description="Learner persona")
            session.add(learner_role)
            session.commit()
            session.refresh(learner_role)

        # Create Learner 1 (Arjun)
        learner1 = User(
            email="learner1.part10c@mospi.gov.in",
            official_id="MOSPI-10C-001",
            full_name="Arjun Learner One",
            password_hash=hash_password("demo123"),
            role_id=learner_role.id,
            is_active=True,
        )
        # Create Learner 2 (Priya)
        learner2 = User(
            email="learner2.part10c@mospi.gov.in",
            official_id="MOSPI-10C-002",
            full_name="Priya Learner Two",
            password_hash=hash_password("demo123"),
            role_id=learner_role.id,
            is_active=True,
        )
        session.add_all([learner1, learner2])
        session.commit()
        session.refresh(learner1)
        session.refresh(learner2)

        state["learner1_id"] = learner1.id
        state["learner2_id"] = learner2.id
        state["learner1_token"] = create_access_token(subject=str(learner1.id), role="LEARNER")
        state["learner2_token"] = create_access_token(subject=str(learner2.id), role="LEARNER")

        # Upload a practice material for Learner 1
        pdf_bytes = create_minimal_pdf_bytes(
            "Official Sampling Methodology and National Statistical Systems. "
            "Stratified random sampling ensures adequate precision across subpopulation estimates. "
            "Data validation requires outlier checks, range consistency, and non-response adjustment."
        )
        files = {
            "file": ("sampling_methodology.pdf", io.BytesIO(pdf_bytes), "application/pdf")
        }
        data = {
            "title": "MoSPI Sampling and Survey Guidelines"
        }
        headers1 = {"Authorization": f"Bearer {state['learner1_token']}"}
        res = client.post("/api/v1/ai-assessments/materials/upload", files=files, data=data, headers=headers1)
        assert res.status_code == 201, f"Material upload failed: {res.text}"
        state["material1_id"] = res.json()["id"]

    yield

    Base.metadata.drop_all(bind=test_engine)


def test_learner_own_material_generation_succeeds():
    """Test 1: Learner 1 generates practice MCQs from their own uploaded material."""
    headers = {"Authorization": f"Bearer {state['learner1_token']}"}
    material_id = state["material1_id"]

    # Test dedicated practice generation endpoint
    payload = {
        "number_of_questions": 5,
        "difficulty": "MEDIUM",
        "language": "English",
    }
    response = client.post(
        f"/api/v1/ai-assessments/materials/{material_id}/generate-practice-quiz",
        json=payload,
        headers=headers,
    )
    assert response.status_code == 201, f"Generation failed: {response.text}"

    data = response.json()
    assert data["material_id"] == material_id
    assert data["generated_count"] == 5
    assert len(data["questions"]) == 5

    # Check question schema fields
    for q in data["questions"]:
        assert "id" in q
        assert "question_text" in q and len(q["question_text"]) >= 10
        # 4 options check
        assert "option_a" in q and len(q["option_a"]) > 0
        assert "option_b" in q and len(q["option_b"]) > 0
        assert "option_c" in q and len(q["option_c"]) > 0
        assert "option_d" in q and len(q["option_d"]) > 0
        assert "options" in q and len(q["options"]) == 4
        # Correct option check
        assert q["correct_option"] in ["A", "B", "C", "D"]
        # Explanation check
        assert "explanation" in q and q["explanation"] is not None and len(q["explanation"]) >= 5
        # Difficulty check
        assert q["difficulty"] in ["EASY", "MEDIUM", "HARD", "MIXED"]
        # Topic check
        assert "topic" in q and q["topic"] is not None and len(q["topic"]) > 0
        # Validation status
        assert q["validation_status"] == "VALID"


def test_other_learner_material_is_rejected():
    """Test 2: Learner 2 attempts to generate MCQs from Learner 1's material -> 403 Forbidden."""
    headers2 = {"Authorization": f"Bearer {state['learner2_token']}"}
    material_id = state["material1_id"]

    payload = {"number_of_questions": 5}
    response = client.post(
        f"/api/v1/ai-assessments/materials/{material_id}/generate-practice-quiz",
        json=payload,
        headers=headers2,
    )
    assert response.status_code == 403
    err_msg = response.json().get("error", {}).get("message", "") or response.json().get("detail", "")
    assert "do not have permission" in err_msg.lower()

    # Also test via /generate endpoint with Learner 2 token
    gen_payload = {
        "material_id": material_id,
        "number_of_questions": 5,
    }
    res_gen = client.post(
        "/api/v1/ai-assessments/generate",
        json=gen_payload,
        headers=headers2,
    )
    assert res_gen.status_code == 403


def test_invalid_material_id_is_rejected():
    """Test 3: Request with non-existent material ID returns 404 Not Found."""
    headers = {"Authorization": f"Bearer {state['learner1_token']}"}
    fake_id = str(uuid.uuid4())

    response = client.post(
        f"/api/v1/ai-assessments/materials/{fake_id}/generate-practice-quiz",
        json={"number_of_questions": 5},
        headers=headers,
    )
    assert response.status_code == 404
    err_msg = response.json().get("error", {}).get("message", "") or response.json().get("detail", "")
    assert "not found" in err_msg.lower()


def test_generated_questions_are_validated():
    """Test 4: Questions generated are strictly validated against QuestionValidationService."""
    headers = {"Authorization": f"Bearer {state['learner1_token']}"}
    material_id = state["material1_id"]

    response = client.post(
        f"/api/v1/ai-assessments/materials/{material_id}/generate-practice-quiz",
        json={"number_of_questions": 5},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()

    for q in data["questions"]:
        # Verify via QuestionValidationService directly
        val_result = QuestionValidationService.validate_generated_question(q)
        assert val_result["is_valid"] is True, f"Validation failed for question: {val_result['errors']}"
        assert val_result["status"] == "VALID"
        assert len(val_result["errors"]) == 0


def test_question_count_is_respected():
    """Test 5: Supported counts 5, 10, 15 succeed; unsupported count (e.g. 7) is rejected with 422."""
    headers = {"Authorization": f"Bearer {state['learner1_token']}"}
    material_id = state["material1_id"]

    # 1. Test count = 5
    res5 = client.post(
        f"/api/v1/ai-assessments/materials/{material_id}/generate-practice-quiz",
        json={"number_of_questions": 5},
        headers=headers,
    )
    assert res5.status_code == 201
    assert len(res5.json()["questions"]) == 5
    assert res5.json()["generated_count"] == 5

    # 2. Test count = 10
    res10 = client.post(
        f"/api/v1/ai-assessments/materials/{material_id}/generate-practice-quiz",
        json={"number_of_questions": 10},
        headers=headers,
    )
    assert res10.status_code == 201
    assert len(res10.json()["questions"]) == 10
    assert res10.json()["generated_count"] == 10

    # 3. Test count = 15
    res15 = client.post(
        f"/api/v1/ai-assessments/materials/{material_id}/generate-practice-quiz",
        json={"number_of_questions": 15},
        headers=headers,
    )
    assert res15.status_code == 201
    assert len(res15.json()["questions"]) == 15
    assert res15.json()["generated_count"] == 15

    # 4. Test invalid count = 7 -> 422 Unprocessable Entity
    res_bad = client.post(
        f"/api/v1/ai-assessments/materials/{material_id}/generate-practice-quiz",
        json={"number_of_questions": 7},
        headers=headers,
    )
    assert res_bad.status_code == 422


def test_zero_side_effects_on_competencies_or_assessments():
    """Test 6: Practice question generation does NOT alter official competencies or create assessments."""
    headers = {"Authorization": f"Bearer {state['learner1_token']}"}
    material_id = state["material1_id"]

    with TestingSessionLocal() as session:
        uc_count_before = session.query(UserCompetency).count()
        assessments_count_before = session.query(Assessment).count()

    response = client.post(
        f"/api/v1/ai-assessments/materials/{material_id}/generate-practice-quiz",
        json={"number_of_questions": 5},
        headers=headers,
    )
    assert response.status_code == 201

    with TestingSessionLocal() as session:
        uc_count_after = session.query(UserCompetency).count()
        assessments_count_after = session.query(Assessment).count()

    assert uc_count_after == uc_count_before, "Practice generation must NOT alter user_competencies"
    assert assessments_count_after == assessments_count_before, "Practice generation must NOT create official assessments"


def run_all_tests():
    print("--- Running Part 10C-1 Learner AI Question Generation Test Suite ---")
    gen = setup_test_environment()
    next(gen, None)

    print("[1/6] Testing learner own material MCQ generation...")
    test_learner_own_material_generation_succeeds()
    print("  -> PASSED: Successfully generated practice MCQs with all required fields (question_text, options, correct_option, explanation, difficulty, topic).")

    print("[2/6] Testing other learner's material access rejection...")
    test_other_learner_material_is_rejected()
    print("  -> PASSED: Access to another learner's material rejected with HTTP 403 Forbidden.")

    print("[3/6] Testing invalid material ID rejection...")
    test_invalid_material_id_is_rejected()
    print("  -> PASSED: Non-existent material ID rejected with HTTP 404 Not Found.")

    print("[4/6] Testing generated question validation compliance...")
    test_generated_questions_are_validated()
    print("  -> PASSED: All generated MCQs strictly adhere to QuestionValidationService rules.")

    print("[5/6] Testing question count adherence (5, 10, 15 valid; 7 rejected)...")
    test_question_count_is_respected()
    print("  -> PASSED: Supported counts (5, 10, 15) return exact counts; invalid count (7) rejected with HTTP 422.")

    print("[6/6] Testing competency scores and official assessment immutability...")
    test_zero_side_effects_on_competencies_or_assessments()
    print("  -> PASSED: user_competencies and official assessments remain completely untouched.")

    try:
        next(gen, None)
    except StopIteration:
        pass

    print(">>> ALL PART 10C-1 TESTS PASSED SUCCESSFULLY (100%) <<<")


if __name__ == "__main__":
    run_all_tests()
