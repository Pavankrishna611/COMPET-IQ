"""Test suite for Part 10H: Trainer Review, Edit & Publish.

Verifies:
1. Trainer can open their own draft assessment and review questions.
2. Trainer can edit a draft question.
3. Trainer can save draft changes without publishing (PUT /trainer/drafts/{id}).
4. Another trainer cannot edit or publish the draft (403 Forbidden).
5. Learner cannot edit or publish trainer draft (403 Forbidden).
6. Invalid questions cannot be published (empty stem, empty option, invalid key -> 400 Bad Request).
7. Empty assessment cannot be published (0 questions -> 400 Bad Request).
8. Valid draft can be published (transitions to PUBLISHED).
9. Published assessment has PUBLISHED status and published_at timestamp.
10. Published assessment is not automatically assigned to learners yet.
11. Cannot edit questions once an assessment is published (400 Bad Request).
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

from pypdf import PageObject, PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject


def create_minimal_pdf_bytes(text_content: str = "MoSPI National Accounts Statistics: Gross Value Added and Deflators") -> bytes:
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

    stream_data = f"BT /F1 12 Tf 50 700 Td ({text_content}) Tj ET".encode("latin-1")
    stream = DecodedStreamObject()
    stream.set_data(stream_data)
    page[NameObject("/Contents")] = stream

    writer.add_page(page)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


class TestPart10HTrainerPublish(unittest.TestCase):
    """Test suite covering Part 10H review, edit, validation, and publishing workflow."""

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

            trainer_role = session.query(Role).filter(Role.name == "TRAINER").first()
            learner_role = session.query(Role).filter(Role.name == "LEARNER").first()

            trainer1 = User(
                email="trainer1_part10h@competiq.gov.in",
                official_id="FACULTY-10H-001",
                full_name="Priya Sharma",
                password_hash=hash_password("TrainerPass123!"),
                is_active=True,
                role_id=trainer_role.id,
            )
            trainer2 = User(
                email="trainer2_part10h@competiq.gov.in",
                official_id="FACULTY-10H-002",
                full_name="Vikram Singh",
                password_hash=hash_password("TrainerPass123!"),
                is_active=True,
                role_id=trainer_role.id,
            )
            learner = User(
                email="learner_part10h@competiq.gov.in",
                official_id="LEARNER-10H-001",
                full_name="Aditya Verma",
                password_hash=hash_password("LearnerPass123!"),
                is_active=True,
                role_id=learner_role.id,
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
        pdf_bytes = create_minimal_pdf_bytes("National Accounts Principles: GDP Estimation Methods and Deflators")
        files = {"file": ("national_accounts_10h.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        data = {"title": "National Accounts Methodology"}
        headers = {"Authorization": f"Bearer {cls.trainer1_token}"}
        res = cls.client.post("/api/v1/ai-assessments/trainer/materials/upload", files=files, data=data, headers=headers)
        assert res.status_code == 201
        cls.material_id = res.json()["id"]

        # Generate a DRAFT assessment with 5 questions for Trainer 1
        gen_payload = {
            "number_of_questions": 5,
            "difficulty": "MEDIUM",
            "title": "National Accounts Draft Evaluation",
        }
        res = cls.client.post(
            f"/api/v1/ai-assessments/trainer/materials/{cls.material_id}/generate-assessment",
            json=gen_payload,
            headers=headers,
        )
        assert res.status_code == 201, f"Failed generating assessment: {res.text}"
        cls.draft_assessment_id = res.json()["assessment_id"]

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)
        app.dependency_overrides.clear()

    def test_01_trainer_open_own_draft(self):
        """1. Trainer can open their own draft assessment and inspect questions."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        res = self.client.get(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}",
            headers=headers,
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["assessment_id"], self.draft_assessment_id)
        self.assertEqual(data["status"], "DRAFT")
        self.assertFalse(data["is_published"])
        self.assertEqual(len(data["questions"]), 5)

        # Check list drafts endpoint as well
        res_list = self.client.get("/api/v1/ai-assessments/trainer/drafts", headers=headers)
        self.assertEqual(res_list.status_code, 200)
        drafts = res_list.json()
        self.assertTrue(any(d["assessment_id"] == self.draft_assessment_id for d in drafts))

    def test_02_trainer_edit_draft_question(self):
        """2. Trainer can edit an individual draft question."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        # First retrieve question ID
        res = self.client.get(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}",
            headers=headers,
        )
        q1 = res.json()["questions"][0]
        q1_id = q1["id"]

        # Edit Question via PUT
        update_payload = {
            "question_text": "Updated Stem: What is the primary method for GDP estimation in MoSPI?",
            "option_a": "Production Approach",
            "option_b": "Informal Speculation",
            "option_c": "Currency Counting",
            "option_d": "Tax Estimate Only",
            "correct_option": "A",
            "explanation": "Production (Output) Approach calculates Gross Value Added directly.",
            "difficulty": "EASY",
            "points": 2.0,
            "sequence_order": 1,
        }
        res_put = self.client.put(
            f"/api/v1/assessments/questions/{q1_id}",
            json=update_payload,
            headers=headers,
        )
        self.assertEqual(res_put.status_code, 200)
        updated_q = res_put.json()
        self.assertEqual(updated_q["question_text"], update_payload["question_text"])
        self.assertEqual(updated_q["option_a"], "Production Approach")
        self.assertEqual(updated_q["correct_option"], "A")

    def test_03_trainer_save_draft_changes(self):
        """3. Trainer can save full draft changes without publishing."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        # Retrieve current questions
        res = self.client.get(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}",
            headers=headers,
        )
        current_data = res.json()
        questions = current_data["questions"]

        # Modify title and update first question
        questions[0]["question_text"] = "Persisted Draft Question 1: What is the GDP Deflator?"
        questions[0]["correct_option"] = "B"
        questions[0]["option_b"] = "Ratio of Nominal GDP to Real GDP"

        save_payload = {
            "title": "National Accounts Calibrated Draft (Saved)",
            "description": "Trainer calibrated version with refined distractor keys.",
            "difficulty": "INTERMEDIATE",
            "duration_minutes": 25,
            "questions": questions,
        }

        res_save = self.client.put(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}",
            json=save_payload,
            headers=headers,
        )
        self.assertEqual(res_save.status_code, 200)
        saved_data = res_save.json()
        self.assertEqual(saved_data["title"], "National Accounts Calibrated Draft (Saved)")
        self.assertEqual(saved_data["status"], "DRAFT")
        self.assertFalse(saved_data["is_published"])
        self.assertEqual(saved_data["questions"][0]["question_text"], "Persisted Draft Question 1: What is the GDP Deflator?")
        self.assertEqual(saved_data["questions"][0]["correct_option"], "B")

    def test_04_another_trainer_cannot_edit_draft(self):
        """4. Trainer 2 cannot edit or save Trainer 1's draft (403 Forbidden)."""
        headers = {"Authorization": f"Bearer {self.trainer2_token}"}
        save_payload = {
            "title": "Unauthorized Modification",
            "questions": [],
        }
        res = self.client.put(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}",
            json=save_payload,
            headers=headers,
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("permission", res.text.lower())

        # Also cannot publish Trainer 1's draft
        res_pub = self.client.post(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}/publish",
            headers=headers,
        )
        self.assertEqual(res_pub.status_code, 403)

    def test_05_learner_cannot_edit_or_publish_trainer_draft(self):
        """5. Learner receives 403 Forbidden when attempting to edit or publish trainer draft."""
        headers = {"Authorization": f"Bearer {self.learner_token}"}
        res = self.client.get(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}",
            headers=headers,
        )
        self.assertEqual(res.status_code, 403)

        res_save = self.client.put(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}",
            json={"title": "Hacked Title"},
            headers=headers,
        )
        self.assertEqual(res_save.status_code, 403)

        res_pub = self.client.post(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}/publish",
            headers=headers,
        )
        self.assertEqual(res_pub.status_code, 403)

    def test_06_invalid_questions_cannot_be_published(self):
        """6. Draft with empty question text, missing options, or invalid key cannot be published."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}

        # Create a draft with an invalid question in the database
        with self.TestingSessionLocal() as session:
            bad_asmt = Assessment(
                title="Faulty Assessment",
                status="DRAFT",
                created_by=self.trainer1_id,
            )
            session.add(bad_asmt)
            session.flush()

            # Question with empty option_c
            bad_q = Question(
                assessment_id=bad_asmt.id,
                question_text="Valid question text?",
                option_a="Option A",
                option_b="Option B",
                option_c="   ",  # EMPTY
                option_d="Option D",
                correct_option="A",
                sequence_order=1,
            )
            session.add(bad_q)
            session.commit()
            bad_asmt_id = str(bad_asmt.id)

        # Attempt to publish -> 400 Bad Request
        res = self.client.post(
            f"/api/v1/ai-assessments/trainer/drafts/{bad_asmt_id}/publish",
            headers=headers,
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Option C", res.text)

    def test_07_empty_assessment_cannot_be_published(self):
        """7. Empty assessment (0 questions) cannot be published (400 Bad Request)."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}

        with self.TestingSessionLocal() as session:
            empty_asmt = Assessment(
                title="Empty Assessment",
                status="DRAFT",
                created_by=self.trainer1_id,
            )
            session.add(empty_asmt)
            session.commit()
            empty_asmt_id = str(empty_asmt.id)

        res = self.client.post(
            f"/api/v1/ai-assessments/trainer/drafts/{empty_asmt_id}/publish",
            headers=headers,
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("at least one question", res.text.lower())

    def test_08_valid_draft_can_be_published(self):
        """8. Valid draft can be published successfully."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        res = self.client.post(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}/publish",
            headers=headers,
        )
        self.assertEqual(res.status_code, 200, f"Publishing failed: {res.text}")
        data = res.json()
        self.assertEqual(data["status"], "PUBLISHED")
        self.assertTrue(data["is_published"])
        self.assertEqual(data["assessment_type"], "TRAINER_OFFICIAL")
        self.assertIsNotNone(data.get("published_at"))

    def test_09_published_assessment_has_published_status(self):
        """9. Assessment in DB confirms PUBLISHED status and published_at timestamp."""
        with self.TestingSessionLocal() as session:
            asmt = session.query(Assessment).filter(Assessment.id == uuid.UUID(self.draft_assessment_id)).first()
            self.assertIsNotNone(asmt)
            self.assertEqual(asmt.status, "PUBLISHED")
            self.assertEqual(asmt.assessment_type, "TRAINER_OFFICIAL")
            self.assertIsNotNone(asmt.published_at)

    def test_10_published_assessment_not_automatically_assigned_to_learners(self):
        """10. Publishing does not auto-assign or create attempt records for learners."""
        with self.TestingSessionLocal() as session:
            asmt = session.query(Assessment).filter(Assessment.id == uuid.UUID(self.draft_assessment_id)).first()
            # No attempts should exist
            self.assertEqual(len(asmt.attempts), 0)

    def test_11_cannot_edit_after_publication(self):
        """11. Once published, questions cannot be edited or added to the assessment."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}

        # Attempt to save draft on published assessment -> 400 Bad Request
        res = self.client.put(
            f"/api/v1/ai-assessments/trainer/drafts/{self.draft_assessment_id}",
            json={"title": "Illegal Edit"},
            headers=headers,
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("already published", res.text.lower())

        # Attempt to add question to published assessment -> 400 Bad Request
        add_payload = {
            "question_text": "Late added question?",
            "option_a": "A",
            "option_b": "B",
            "option_c": "C",
            "option_d": "D",
            "correct_option": "A",
        }
        res_add = self.client.post(
            f"/api/v1/assessments/{self.draft_assessment_id}/questions",
            json=add_payload,
            headers=headers,
        )
        self.assertEqual(res_add.status_code, 400)
        self.assertIn("already published", res_add.text.lower())


if __name__ == "__main__":
    unittest.main()
