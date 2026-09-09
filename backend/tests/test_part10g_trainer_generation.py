"""Test suite for Part 10G: Trainer AI Assessment Question Generation.

Verifies:
1. Trainer can generate questions from their own READY material.
2. Learner receives 403 Forbidden when calling trainer generation endpoints.
3. Trainer cannot generate from another trainer's material (403 Forbidden).
4. Unprocessed / failed / empty material cannot be used (400 Bad Request).
5. 5/10/15 question counts are respected; invalid counts rejected (422).
6. Generated questions pass existing validation rules.
7. Generated assessment is saved as DRAFT with TRAINER_OFFICIAL type.
8. Draft assessment is not visible to learners.
9. LLM fallback follows the existing architecture (MOCK when no API key).
10. Trainer can retrieve draft assessment preview.
"""

import io
import os
import sys
import unittest
import uuid

# Add parent directory to sys.path for test resolution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user, get_db
from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.database.base import Base
from app.database.init_db import seed_database_data
from app.main import app
from app.models.assessment import Assessment
from app.models.learning_material import LearningMaterial
from app.models.question import Question
from app.models.role import Role
from app.models.user import User
from app.services.assessment_service import AssessmentService

from pypdf import PageObject, PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject


def create_minimal_pdf_bytes(text_content: str = "Official MoSPI National Accounts Statistics: Gross Value Added, GDP Deflator, and Sectoral Contributions") -> bytes:
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


class TestPart10GTrainerGeneration(unittest.TestCase):
    """Test suite for Part 10G Trainer AI Assessment Question Generation."""

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

        with cls.TestingSessionLocal() as session:
            seed_database_data(session)

            # Ensure roles exist
            trainer_role = session.query(Role).filter(Role.name == "TRAINER").first()
            if not trainer_role:
                trainer_role = Role(name="TRAINER", description="Faculty Trainer")
                session.add(trainer_role)

            learner_role = session.query(Role).filter(Role.name == "LEARNER").first()
            if not learner_role:
                learner_role = Role(name="LEARNER", description="Learner Officer")
                session.add(learner_role)
            session.commit()

            # Create Trainer 1 (Dr. Verma)
            trainer1 = User(
                email="faculty.verma@mospi.gov.in",
                official_id="FACULTY-10G-001",
                full_name="Dr. S. K. Verma",
                password_hash=hash_password("trainer123"),
                role_id=trainer_role.id,
                is_active=True,
            )
            # Create Trainer 2 (Dr. Roy)
            trainer2 = User(
                email="faculty.roy@mospi.gov.in",
                official_id="FACULTY-10G-002",
                full_name="Dr. Poulomi Roy",
                password_hash=hash_password("trainer123"),
                role_id=trainer_role.id,
                is_active=True,
            )
            # Create Learner (Officer Alok)
            learner = User(
                email="learner.alok@mospi.gov.in",
                official_id="LEARNER-10G-001",
                full_name="Alok Kumar",
                password_hash=hash_password("learner123"),
                role_id=learner_role.id,
                is_active=True,
            )
            session.add_all([trainer1, trainer2, learner])
            session.commit()
            session.refresh(trainer1)
            session.refresh(trainer2)
            session.refresh(learner)

            cls.trainer1_id = trainer1.id
            cls.trainer2_id = trainer2.id
            cls.learner_id = learner.id

            cls.trainer1_token = create_access_token(subject=str(trainer1.id), role="TRAINER")
            cls.trainer2_token = create_access_token(subject=str(trainer2.id), role="TRAINER")
            cls.learner_token = create_access_token(subject=str(learner.id), role="LEARNER")

        def override_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_db
        cls.client = TestClient(app)

        # Upload a READY material for Trainer 1
        pdf_bytes = create_minimal_pdf_bytes("National Accounts Principles: GDP Estimation Methods, Input-Output Tables, and Deflators")
        files = {"file": ("national_accounts.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        data = {"title": "National Accounts Methodology Guide"}
        headers = {"Authorization": f"Bearer {cls.trainer1_token}"}
        res = cls.client.post("/api/v1/ai-assessments/trainer/materials/upload", files=files, data=data, headers=headers)
        assert res.status_code == 201, f"Failed setting up material: {res.text}"
        cls.ready_material_id = res.json()["id"]

        # Create an UNPROCESSED (FAILED) material for Trainer 1
        with cls.TestingSessionLocal() as session:
            failed_mat = LearningMaterial(
                title="Corrupted Survey Notes",
                original_filename="corrupted.pdf",
                stored_filename=f"{uuid.uuid4()}.pdf",
                file_type="pdf",
                file_path="uploads/corrupted.pdf",
                file_size=1024,
                uploaded_by=trainer1.id,
                material_type="TRAINER_OFFICIAL",
                status="FAILED",
                extraction_error="Corrupted PDF bytes",
            )
            session.add(failed_mat)
            session.commit()
            session.refresh(failed_mat)
            cls.failed_material_id = str(failed_mat.id)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)
        app.dependency_overrides.clear()

    def test_01_trainer_generate_questions_success(self):
        """1. Trainer can generate questions from their own READY material."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        payload = {
            "number_of_questions": 5,
            "difficulty": "MEDIUM",
            "title": "National Accounts Mid-Term Blueprint",
        }

        res = self.client.post(
            f"/api/v1/ai-assessments/trainer/materials/{self.ready_material_id}/generate-assessment",
            json=payload,
            headers=headers,
        )
        self.assertEqual(res.status_code, 201, f"Generation failed: {res.text}")
        data = res.json()

        self.assertIn("assessment_id", data)
        self.assertEqual(data["title"], "National Accounts Mid-Term Blueprint")
        self.assertEqual(data["status"], "DRAFT")
        self.assertEqual(data["assessment_type"], "TRAINER_OFFICIAL")
        self.assertFalse(data["is_published"])
        self.assertEqual(data["number_of_questions"], 5)
        self.assertEqual(len(data["questions"]), 5)

        # Store for subsequent tests
        TestPart10GTrainerGeneration.generated_assessment_id = data["assessment_id"]

        # Verify question structure
        for idx, q in enumerate(data["questions"], start=1):
            self.assertEqual(q["sequence_order"], idx)
            self.assertTrue(len(q["question_text"]) >= 10)
            self.assertIn(q["correct_option"], ["A", "B", "C", "D"])
            self.assertTrue(q["option_a"])
            self.assertTrue(q["option_b"])
            self.assertTrue(q["option_c"])
            self.assertTrue(q["option_d"])
            self.assertTrue(q["explanation"])
            self.assertEqual(q["difficulty"], "MEDIUM")

    def test_02_learner_receives_403_on_trainer_generation(self):
        """2. Learner receives 403 Forbidden when calling trainer generation endpoint."""
        headers = {"Authorization": f"Bearer {self.learner_token}"}
        payload = {"number_of_questions": 5, "difficulty": "MEDIUM"}

        res = self.client.post(
            f"/api/v1/ai-assessments/trainer/materials/{self.ready_material_id}/generate-assessment",
            json=payload,
            headers=headers,
        )
        self.assertEqual(res.status_code, 403)

    def test_03_trainer_cannot_generate_from_another_trainer_material(self):
        """3. Trainer 2 cannot generate questions from Trainer 1's material (403 Forbidden)."""
        headers = {"Authorization": f"Bearer {self.trainer2_token}"}
        payload = {"number_of_questions": 5, "difficulty": "MEDIUM"}

        res = self.client.post(
            f"/api/v1/ai-assessments/trainer/materials/{self.ready_material_id}/generate-assessment",
            json=payload,
            headers=headers,
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("permission", res.text.lower())

    def test_04_unprocessed_material_cannot_be_used(self):
        """4. Unprocessed / failed / empty material is rejected with 400 Bad Request."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        payload = {"number_of_questions": 5, "difficulty": "MEDIUM"}

        res = self.client.post(
            f"/api/v1/ai-assessments/trainer/materials/{self.failed_material_id}/generate-assessment",
            json=payload,
            headers=headers,
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("not in processed/ready status", res.text.lower())

    def test_05_question_counts_5_10_15_respected(self):
        """5. Question counts 5, 10, 15 are accepted; invalid count (7) is rejected with 422."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}

        # 10 questions
        res10 = self.client.post(
            f"/api/v1/ai-assessments/trainer/materials/{self.ready_material_id}/generate-assessment",
            json={"number_of_questions": 10, "difficulty": "HARD"},
            headers=headers,
        )
        self.assertEqual(res10.status_code, 201)
        self.assertEqual(res10.json()["number_of_questions"], 10)

        # 15 questions
        res15 = self.client.post(
            f"/api/v1/ai-assessments/trainer/materials/{self.ready_material_id}/generate-assessment",
            json={"number_of_questions": 15, "difficulty": "EASY"},
            headers=headers,
        )
        self.assertEqual(res15.status_code, 201)
        self.assertEqual(res15.json()["number_of_questions"], 15)

        # 7 questions (invalid)
        res7 = self.client.post(
            f"/api/v1/ai-assessments/trainer/materials/{self.ready_material_id}/generate-assessment",
            json={"number_of_questions": 7},
            headers=headers,
        )
        self.assertEqual(res7.status_code, 422)

    def test_06_generated_assessment_saved_as_draft(self):
        """6. Generated assessment is persisted in the database with status='DRAFT' and assessment_type='TRAINER_OFFICIAL'."""
        with self.TestingSessionLocal() as session:
            asmt = session.query(Assessment).filter(Assessment.id == uuid.UUID(self.generated_assessment_id)).first()
            self.assertIsNotNone(asmt)
            self.assertEqual(asmt.status, "DRAFT")
            self.assertEqual(asmt.assessment_type, "TRAINER_OFFICIAL")
            self.assertEqual(asmt.created_by, self.trainer1_id)

            # Check official questions attached
            qs = session.query(Question).filter(Question.assessment_id == asmt.id).all()
            self.assertEqual(len(qs), 5)
            for q in qs:
                self.assertIsNotNone(q.question_text)
                self.assertIn(q.correct_option, ["A", "B", "C", "D"])

    def test_07_draft_assessment_not_visible_to_learners(self):
        """7. Learners only see PUBLISHED assessments; draft is completely invisible."""
        with self.TestingSessionLocal() as session:
            # Query as learner via AssessmentService
            learner_visible = AssessmentService.get_assessments(session, is_learner=True)
            learner_visible_ids = [str(a.id) for a in learner_visible]
            self.assertNotIn(self.generated_assessment_id, learner_visible_ids)

    def test_08_llm_fallback_follows_architecture(self):
        """8. When no LLM API key is configured, generation uses MockLLMProvider cleanly."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        res = self.client.post(
            f"/api/v1/ai-assessments/trainer/materials/{self.ready_material_id}/generate-assessment",
            json={"number_of_questions": 5},
            headers=headers,
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["generation_mode"], "MOCK")
        self.assertTrue(data["is_mock_fallback"])

    def test_09_trainer_can_retrieve_draft_preview(self):
        """9. Owning trainer can retrieve the draft preview; foreign trainer receives 403."""
        headers1 = {"Authorization": f"Bearer {self.trainer1_token}"}
        headers2 = {"Authorization": f"Bearer {self.trainer2_token}"}

        # Trainer 1 gets preview
        res1 = self.client.get(f"/api/v1/ai-assessments/trainer/drafts/{self.generated_assessment_id}", headers=headers1)
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["assessment_id"], self.generated_assessment_id)
        self.assertEqual(len(res1.json()["questions"]), 5)

        # Trainer 2 attempts to get Trainer 1's preview
        res2 = self.client.get(f"/api/v1/ai-assessments/trainer/drafts/{self.generated_assessment_id}", headers=headers2)
        self.assertEqual(res2.status_code, 403)

    def test_10_alias_endpoint_works(self):
        """10. Endpoint alias /materials/{material_id}/generate functions identically."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        res = self.client.post(
            f"/api/v1/ai-assessments/trainer/materials/{self.ready_material_id}/generate",
            json={"number_of_questions": 5},
            headers=headers,
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["status"], "DRAFT")


if __name__ == "__main__":
    unittest.main()
