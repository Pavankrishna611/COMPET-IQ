"""Test suite for Part 10D: Learner Practice Quiz and Server-Side Evaluation."""

import io
import os
import sys
import unittest
import uuid
from datetime import datetime, timezone

# Add parent directory to sys.path for test resolution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user, get_db
from app.database.base import Base
from app.database.init_db import seed_database_data
from app.main import app
from app.models.assessment import Assessment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.department import Department
from app.models.generated_question import GeneratedQuestion
from app.models.learning_material import LearningMaterial
from app.models.practice_quiz_attempt import PracticeQuizAttempt
from app.models.role import Role
from app.models.user import User
from app.models.user_competency import UserCompetency


from pypdf import PageObject, PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject


def create_minimal_pdf_bytes(text_content: str = "Official Survey Methodology Guidelines: Stratified Random Sampling and Non-Sampling Error Analysis in Economic Indicators") -> bytes:
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


class TestPart10DPracticeQuiz(unittest.TestCase):
    """Integration test suite verifying Part 10D practice quiz taking, scoring, and isolation."""

    @classmethod
    def setUpClass(cls):
        # Create in-memory SQLite database
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=cls.engine
        )
        Base.metadata.create_all(bind=cls.engine)

        # Seed reference data
        db = cls.TestingSessionLocal()
        seed_database_data(db)

        # Setup test users
        learner_role = db.query(Role).filter(Role.name == "LEARNER").first()
        dept = db.query(Department).first()

        cls.learner_1_id = uuid.uuid4()
        cls.learner_2_id = uuid.uuid4()

        l1 = User(
            id=cls.learner_1_id,
            email="learner1_quiz@mospi.gov.in",
            password_hash="hashed_password_1",
            full_name="Pooja Sharma",
            official_id="MOSPI-LRN-101",
            is_active=True,
            role_id=learner_role.id,
            department_id=dept.id if dept else None,
        )
        l2 = User(
            id=cls.learner_2_id,
            email="learner2_quiz@mospi.gov.in",
            password_hash="hashed_password_2",
            full_name="Karan Verma",
            official_id="MOSPI-LRN-102",
            is_active=True,
            role_id=learner_role.id,
            department_id=dept.id if dept else None,
        )
        db.add(l1)
        db.add(l2)
        db.commit()
        db.close()

    def setUp(self):
        self.db = self.TestingSessionLocal()
        self.client = TestClient(app)
        self.learner_1 = self.db.query(User).filter(User.id == self.learner_1_id).first()
        self.learner_2 = self.db.query(User).filter(User.id == self.learner_2_id).first()
        self.current_acting_user = self.learner_1

        def override_get_db():
            try:
                yield self.db
            finally:
                pass

        def override_get_current_user():
            return self.current_acting_user

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_current_user

    def tearDown(self):
        self.db.close()
        app.dependency_overrides.clear()

    def _upload_test_pdf_and_generate(self, user: User, question_count: int = 5):
        """Helper to upload a sample PDF and generate practice MCQs."""
        self.current_acting_user = user

        pdf_bytes = create_minimal_pdf_bytes()
        upload_resp = self.client.post(
            "/api/v1/ai-assessments/materials/upload",
            files={"file": ("survey_sampling.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
            data={"title": "Official Survey Sampling Methodology"},
        )
        self.assertEqual(upload_resp.status_code, 201)
        material_data = upload_resp.json()
        material_id = material_data["id"]

        # Generate practice quiz
        gen_resp = self.client.post(
            f"/api/v1/ai-assessments/materials/{material_id}/generate-practice-quiz",
            json={"number_of_questions": question_count, "difficulty": "MEDIUM"},
        )
        self.assertEqual(gen_resp.status_code, 201)
        quiz_data = gen_resp.json()
        return material_id, quiz_data

    def test_01_quiz_submission_and_server_scoring(self):
        """Test full practice quiz submission and server-side evaluation."""
        material_id, quiz_data = self._upload_test_pdf_and_generate(self.learner_1, 5)
        questions = quiz_data["questions"]
        self.assertEqual(len(questions), 5)

        # Build answers:
        # q0: correct
        # q1: correct
        # q2: incorrect
        # q3: skipped (None)
        # q4: correct
        answers = [
            {"question_id": questions[0]["id"], "selected_option": questions[0]["correct_option"]},
            {"question_id": questions[1]["id"], "selected_option": questions[1]["correct_option"]},
            {
                "question_id": questions[2]["id"],
                "selected_option": "A" if questions[2]["correct_option"] != "A" else "B",
            },
            {"question_id": questions[3]["id"], "selected_option": None},
            {"question_id": questions[4]["id"], "selected_option": questions[4]["correct_option"]},
        ]

        submit_resp = self.client.post(
            f"/api/v1/ai-assessments/materials/{material_id}/submit-practice-quiz",
            json={"answers": answers, "time_taken_seconds": 95},
        )
        self.assertEqual(submit_resp.status_code, 200)
        result = submit_resp.json()

        # 3 correct out of 5 -> 60.0%
        self.assertEqual(result["total_questions"], 5)
        self.assertEqual(result["correct_answers"], 3)
        self.assertEqual(result["incorrect_answers"], 2)
        self.assertEqual(result["score"], 3.0)
        self.assertEqual(result["percentage"], 60.0)
        self.assertEqual(result["time_taken_seconds"], 95)
        self.assertEqual(len(result["question_review"]), 5)

        # Verify review details
        rev_0 = result["question_review"][0]
        self.assertTrue(rev_0["is_correct"])
        self.assertIsNotNone(rev_0["explanation"])

        rev_2 = result["question_review"][2]
        self.assertFalse(rev_2["is_correct"])
        self.assertNotEqual(rev_2["selected_option"], rev_2["correct_option"])

        rev_3 = result["question_review"][3]
        self.assertFalse(rev_3["is_correct"])
        self.assertIsNone(rev_3["selected_option"])

    def test_02_practice_quiz_review_endpoint(self):
        """Test retrieving past practice quiz result via GET /practice-quiz/{attempt_id}."""
        material_id, quiz_data = self._upload_test_pdf_and_generate(self.learner_1, 5)
        questions = quiz_data["questions"]

        # Submit all correct
        answers = [
            {"question_id": q["id"], "selected_option": q["correct_option"]}
            for q in questions
        ]
        submit_resp = self.client.post(
            f"/api/v1/ai-assessments/materials/{material_id}/submit-practice-quiz",
            json={"answers": answers, "time_taken_seconds": 60},
        )
        self.assertEqual(submit_resp.status_code, 200)
        attempt_id = submit_resp.json()["attempt_id"]

        # Review via GET endpoint
        get_resp = self.client.get(f"/api/v1/ai-assessments/practice-quiz/{attempt_id}")
        self.assertEqual(get_resp.status_code, 200)
        review_data = get_resp.json()
        self.assertEqual(review_data["attempt_id"], attempt_id)
        self.assertEqual(review_data["correct_answers"], 5)
        self.assertEqual(review_data["percentage"], 100.0)

    def test_03_ownership_isolation(self):
        """Verify another learner cannot submit or review another learner's practice quiz."""
        material_id, quiz_data = self._upload_test_pdf_and_generate(self.learner_1, 5)
        questions = quiz_data["questions"]

        # Submit by owner
        answers = [
            {"question_id": q["id"], "selected_option": q["correct_option"]}
            for q in questions
        ]
        submit_resp = self.client.post(
            f"/api/v1/ai-assessments/materials/{material_id}/submit-practice-quiz",
            json={"answers": answers},
        )
        self.assertEqual(submit_resp.status_code, 200)
        attempt_id = submit_resp.json()["attempt_id"]

        # Switch to Learner 2
        self.current_acting_user = self.learner_2

        # 1. Learner 2 tries to submit for Learner 1's material
        l2_submit = self.client.post(
            f"/api/v1/ai-assessments/materials/{material_id}/submit-practice-quiz",
            json={"answers": answers},
        )
        self.assertEqual(l2_submit.status_code, 403)

        # 2. Learner 2 tries to view Learner 1's practice attempt review
        l2_review = self.client.get(f"/api/v1/ai-assessments/practice-quiz/{attempt_id}")
        self.assertEqual(l2_review.status_code, 403)

    def test_04_forged_question_rejection(self):
        """Verify submitting invalid or foreign question IDs is rejected."""
        material_id, quiz_data = self._upload_test_pdf_and_generate(self.learner_1, 5)

        fake_qid = str(uuid.uuid4())
        resp = self.client.post(
            f"/api/v1/ai-assessments/materials/{material_id}/submit-practice-quiz",
            json={"answers": [{"question_id": fake_qid, "selected_option": "A"}]},
        )
        self.assertEqual(resp.status_code, 404)

    def test_05_competency_and_official_assessments_remain_untouched(self):
        """Ensure practice quiz submission NEVER modifies user_competencies or official assessments."""
        initial_competencies = self.db.query(UserCompetency).count()
        initial_assessments = self.db.query(Assessment).count()
        initial_assessment_attempts = self.db.query(AssessmentAttempt).count()

        material_id, quiz_data = self._upload_test_pdf_and_generate(self.learner_1, 5)
        questions = quiz_data["questions"]

        answers = [
            {"question_id": q["id"], "selected_option": q["correct_option"]}
            for q in questions
        ]
        submit_resp = self.client.post(
            f"/api/v1/ai-assessments/materials/{material_id}/submit-practice-quiz",
            json={"answers": answers},
        )
        self.assertEqual(submit_resp.status_code, 200)

        # Check tables after practice submission
        final_competencies = self.db.query(UserCompetency).count()
        final_assessments = self.db.query(Assessment).count()
        final_assessment_attempts = self.db.query(AssessmentAttempt).count()

        self.assertEqual(initial_competencies, final_competencies)
        self.assertEqual(initial_assessments, final_assessments)
        self.assertEqual(initial_assessment_attempts, final_assessment_attempts)


if __name__ == "__main__":
    print("--- Running Part 10D Learner Practice Quiz Test Suite ---")
    unittest.main()
