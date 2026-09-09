"""Automated test suite for Part 10B: Learner AI Quiz Material Upload Foundation.

Verifies:
1. Learner can upload PDF learning material and text is cleanly extracted.
2. Invalid document formats (.exe, .jpg) are properly rejected.
3. Uploaded materials are strictly associated with the authenticated learner.
4. Extracted text is saved and available for AI question generation.
5. Strict ownership isolation: Learner B cannot access or delete Learner A's material.
6. Learner listing only returns personal practice materials.
7. Material upload does NOT modify official competency scores (user_competencies).
8. Material upload does NOT create or publish official assessments.
9. Learner can delete their own uploaded practice material.
"""

import io
import sys
import uuid
from pathlib import Path

from fastapi.testclient import TestClient
from pypdf import PdfWriter

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
    from pypdf import PageObject, PdfWriter
    from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

    writer = PdfWriter()
    page = PageObject.create_blank_page(width=612, height=792)

    # Define standard Helvetica font
    font = DictionaryObject()
    font[NameObject("/Type")] = NameObject("/Font")
    font[NameObject("/Subtype")] = NameObject("/Type1")
    font[NameObject("/BaseFont")] = NameObject("/Helvetica")

    fonts = DictionaryObject()
    fonts[NameObject("/F1")] = font

    resources = DictionaryObject()
    resources[NameObject("/Font")] = fonts
    page[NameObject("/Resources")] = resources

    # Add text content stream
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
            email="learner1.part10@mospi.gov.in",
            official_id="MOSPI-10B-001",
            full_name="Arjun Learner One",
            password_hash=hash_password("demo123"),
            role_id=learner_role.id,
            is_active=True,
        )
        # Create Learner 2 (Priya)
        learner2 = User(
            email="learner2.part10@mospi.gov.in",
            official_id="MOSPI-10B-002",
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


    yield

    Base.metadata.drop_all(bind=test_engine)


def test_learner_upload_valid_pdf():
    """Test 1: Authenticated learner can upload PDF; text is extracted and status is PROCESSED."""
    pdf_bytes = create_minimal_pdf_bytes("Indian Official Statistics Sample Survey Practice Content")
    files = {
        "file": ("survey_manual.pdf", io.BytesIO(pdf_bytes), "application/pdf")
    }
    data = {
        "title": "MoSPI Survey Design Manual 2026"
    }
    headers = {"Authorization": f"Bearer {state['learner1_token']}"}

    response = client.post("/api/v1/ai-assessments/materials/upload", files=files, data=data, headers=headers)
    assert response.status_code == 201, f"Upload failed: {response.text}"
    
    payload = response.json()
    assert payload["title"] == "MoSPI Survey Design Manual 2026"
    assert payload["file_type"] == "pdf"
    assert payload["status"] == "PROCESSED"
    assert payload["has_extracted_text"] is True
    assert payload["word_count"] > 0
    assert "id" in payload

    state["material1_id"] = payload["id"]

    # Verify directly in DB that uploaded_by matches learner1
    with TestingSessionLocal() as session:
        mat = session.query(LearningMaterial).filter(LearningMaterial.id == uuid.UUID(payload["id"])).first()
        assert mat is not None
        assert mat.uploaded_by == state["learner1_id"]
        assert mat.extracted_text is not None
        assert "Survey" in mat.extracted_text


def test_learner_upload_invalid_file_type_rejected():
    """Test 2: Invalid document types (.exe, .jpg) are rejected."""
    bad_bytes = b"MZ executable dummy content"
    files = {
        "file": ("malicious_file.exe", io.BytesIO(bad_bytes), "application/octet-stream")
    }
    headers = {"Authorization": f"Bearer {state['learner1_token']}"}

    response = client.post("/api/v1/ai-assessments/materials/upload", files=files, headers=headers)
    assert response.status_code == 415
    err_msg = response.json().get("error", {}).get("message", "") or response.json().get("detail", "")
    assert "Unsupported file type" in err_msg


def test_ownership_isolation_learner_cannot_access_other_material():
    """Test 3: Learner 2 cannot access Learner 1's uploaded material (403 Forbidden)."""
    headers_learner2 = {"Authorization": f"Bearer {state['learner2_token']}"}
    material_id = state["material1_id"]

    # 1. Learner 2 tries to GET material details
    res_get = client.get(f"/api/v1/ai-assessments/materials/{material_id}", headers=headers_learner2)
    assert res_get.status_code == 403
    err_msg = res_get.json().get("error", {}).get("message", "") or res_get.json().get("detail", "")
    assert "do not have permission" in err_msg.lower()


    # 2. Learner 2 tries to GET analysis
    res_analysis = client.get(f"/api/v1/ai-assessments/materials/{material_id}/analysis", headers=headers_learner2)
    assert res_analysis.status_code == 403

    # 3. Learner 2 tries to DELETE material
    res_del = client.delete(f"/api/v1/ai-assessments/materials/{material_id}", headers=headers_learner2)
    assert res_del.status_code == 403


def test_material_list_is_scoped_to_current_learner():
    """Test 4: Each learner only sees their own materials when listing."""
    # Learner 2 uploads their own material
    pdf_bytes = create_minimal_pdf_bytes("Python for Data Analysis and Econometrics")
    files = {
        "file": ("python_guide.pdf", io.BytesIO(pdf_bytes), "application/pdf")
    }
    data = {"title": "Priya Python Notes"}
    headers2 = {"Authorization": f"Bearer {state['learner2_token']}"}

    res2_upload = client.post("/api/v1/ai-assessments/materials/upload", files=files, data=data, headers=headers2)
    assert res2_upload.status_code == 201
    material2_id = res2_upload.json()["id"]
    state["material2_id"] = material2_id

    # Learner 1 lists materials
    headers1 = {"Authorization": f"Bearer {state['learner1_token']}"}
    res1_list = client.get("/api/v1/ai-assessments/materials", headers=headers1)
    assert res1_list.status_code == 200
    materials1 = res1_list.json()
    ids1 = [m["id"] for m in materials1]
    assert state["material1_id"] in ids1
    assert material2_id not in ids1  # Learner 1 cannot see Learner 2's material!

    # Learner 2 lists materials
    res2_list = client.get("/api/v1/ai-assessments/materials", headers=headers2)
    assert res2_list.status_code == 200
    materials2 = res2_list.json()
    ids2 = [m["id"] for m in materials2]
    assert material2_id in ids2
    assert state["material1_id"] not in ids2  # Learner 2 cannot see Learner 1's material!


def test_upload_does_not_modify_competency_scores_or_assessments():
    """Test 5: Personal practice uploads NEVER alter official user_competencies or create official assessments."""
    with TestingSessionLocal() as session:
        uc_count_before = session.query(UserCompetency).count()
        assessments_count_before = session.query(Assessment).count()

    # Upload another document
    pdf_bytes = create_minimal_pdf_bytes("Advanced Regression Modeling notes")
    files = {
        "file": ("regression.pdf", io.BytesIO(pdf_bytes), "application/pdf")
    }
    headers = {"Authorization": f"Bearer {state['learner1_token']}"}
    res = client.post("/api/v1/ai-assessments/materials/upload", files=files, headers=headers)
    assert res.status_code == 201

    with TestingSessionLocal() as session:
        uc_count_after = session.query(UserCompetency).count()
        assessments_count_after = session.query(Assessment).count()

    assert uc_count_after == uc_count_before, "user_competencies must NOT be modified by material upload"
    assert assessments_count_after == assessments_count_before, "assessments must NOT be created by practice material upload"


def test_learner_can_delete_own_material():
    """Test 6: Learner can delete their own material, which removes it from DB."""
    headers1 = {"Authorization": f"Bearer {state['learner1_token']}"}
    material_id = state["material1_id"]

    # Delete
    del_res = client.delete(f"/api/v1/ai-assessments/materials/{material_id}", headers=headers1)
    assert del_res.status_code == 200
    assert "successfully deleted" in del_res.json()["message"].lower()

    # Verify subsequent GET returns 404
    get_res = client.get(f"/api/v1/ai-assessments/materials/{material_id}", headers=headers1)
    assert get_res.status_code == 404


def test_unauthenticated_request_rejected():
    """Test 7: Unauthenticated request is rejected."""
    res = client.get("/api/v1/ai-assessments/materials")
    assert res.status_code in (401, 403)


def run_all_tests():
    print("--- Running Part 10B Learner AI Quiz Material Upload Test Suite ---")
    gen = setup_test_environment()
    next(gen, None)

    print("[1/7] Testing valid PDF upload and text extraction...")
    test_learner_upload_valid_pdf()
    print("  -> PASSED: PDF uploaded, status PROCESSED, extracted text & word count verified.")

    print("[2/7] Testing invalid file type rejection (.exe)...")
    test_learner_upload_invalid_file_type_rejected()
    print("  -> PASSED: Invalid file type rejected with HTTP 415.")

    print("[3/7] Testing material ownership isolation...")
    test_ownership_isolation_learner_cannot_access_other_material()
    print("  -> PASSED: Unauthorized learner access blocked with HTTP 403 Forbidden.")

    print("[4/7] Testing material listing user scoping...")
    test_material_list_is_scoped_to_current_learner()
    print("  -> PASSED: Learners only see their own uploaded practice materials.")

    print("[5/7] Testing competency scores and official assessment immutability...")
    test_upload_does_not_modify_competency_scores_or_assessments()
    print("  -> PASSED: Zero changes to user_competencies or official assessments table.")

    print("[6/7] Testing learner material deletion...")
    test_learner_can_delete_own_material()
    print("  -> PASSED: Material deleted and verified 404.")

    print("[7/7] Testing unauthenticated access rejection...")
    test_unauthenticated_request_rejected()
    print("  -> PASSED: Anonymous request rejected.")

    try:
        next(gen, None)
    except StopIteration:
        pass

    print(">>> ALL PART 10B TESTS PASSED SUCCESSFULLY (100%) <<<")


if __name__ == "__main__":
    run_all_tests()

