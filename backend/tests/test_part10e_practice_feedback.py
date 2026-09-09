"""Test suite for Part 10E: AI Learning Feedback and Weak-Topic Analysis for Learner Practice Quizzes."""

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
from app.database.base import Base
from app.database.init_db import seed_database_data
from app.main import app
from app.models.assessment import Assessment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.competency import Competency
from app.models.course import Course
from app.models.department import Department
from app.models.generated_question import GeneratedQuestion
from app.models.learning_material import LearningMaterial
from app.models.practice_quiz_attempt import PracticeQuizAttempt
from app.models.role import Role
from app.models.user import User
from app.models.user_competency import UserCompetency

from pypdf import PageObject, PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject


def create_minimal_pdf_bytes(text_content: str = "Survey Sampling Guidelines: Principles of Stratified Sampling, Multi-Stage Sampling, and Data Quality Assurance in National Surveys") -> bytes:
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


class TestPart10EPracticeFeedback(unittest.TestCase):
    """Integration test suite verifying Part 10E AI feedback synthesis and weak-topic analysis."""

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=cls.engine
        )
        Base.metadata.create_all(bind=cls.engine)

        db = cls.TestingSessionLocal()
        seed_database_data(db)

        learner_role = db.query(Role).filter(Role.name == "LEARNER").first()
        dept = db.query(Department).first()

        cls.learner_1_id = uuid.uuid4()
        cls.learner_2_id = uuid.uuid4()

        l1 = User(
            id=cls.learner_1_id,
            email="learner1_fb@mospi.gov.in",
            password_hash="hashed_pw_1",
            full_name="Pooja Sharma",
            official_id="MOSPI-FB-101",
            is_active=True,
            role_id=learner_role.id,
            department_id=dept.id if dept else None,
        )
        l2 = User(
            id=cls.learner_2_id,
            email="learner2_fb@mospi.gov.in",
            password_hash="hashed_pw_2",
            full_name="Karan Verma",
            official_id="MOSPI-FB-102",
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
        app.dependency_overrides.clear()
        self.db.close()

    def _upload_test_pdf_and_generate_and_submit(self, user: User, missed_count: int = 2):
        """Helper to create a completed practice attempt for tests."""
        self.current_acting_user = user
        pdf_bytes = create_minimal_pdf_bytes()

        # 1. Upload
        upload_resp = self.client.post(
            "/api/v1/ai-assessments/materials/upload",
            files={"file": ("survey_sampling_manual.pdf", pdf_bytes, "application/pdf")},
            data={"title": "Survey Sampling Manual"},
        )
        material_id = upload_resp.json()["id"]

        # 2. Generate 5 MCQs
        gen_resp = self.client.post(
            f"/api/v1/ai-assessments/materials/{material_id}/generate-practice-quiz",
            json={"number_of_questions": 5, "difficulty": "MEDIUM"},
        )
        questions = gen_resp.json()["questions"]

        # 3. Submit answers (with missed_count wrong answers)
        answers = []
        for i, q in enumerate(questions):
            if i < missed_count:
                # Wrong answer
                wrong_opt = "B" if q["correct_option"] == "A" else "A"
                answers.append({"question_id": q["id"], "selected_option": wrong_opt})
            else:
                # Correct answer
                answers.append({"question_id": q["id"], "selected_option": q["correct_option"]})

        submit_resp = self.client.post(
            f"/api/v1/ai-assessments/materials/{material_id}/submit-practice-quiz",
            json={"answers": answers, "time_taken_seconds": 120},
        )
        attempt_id = submit_resp.json()["attempt_id"]
        return material_id, attempt_id, questions

    def test_01_completed_attempt_generates_feedback(self):
        """Test that a completed practice attempt generates structured AI feedback."""
        material_id, attempt_id, questions = self._upload_test_pdf_and_generate_and_submit(
            self.learner_1, missed_count=2
        )

        resp = self.client.post(f"/api/v1/ai-assessments/practice-quiz/{attempt_id}/feedback")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        # Verify fields
        self.assertEqual(data["attempt_id"], attempt_id)
        self.assertEqual(data["total_questions"], 5)
        self.assertEqual(data["correct_answers"], 3)
        self.assertEqual(data["incorrect_answers"], 2)
        self.assertEqual(data["score"], 3.0)
        self.assertEqual(data["percentage"], 60.0)

        # Narrative sections
        self.assertTrue(len(data["overall_summary"]) > 10)
        self.assertTrue(len(data["strengths"]) >= 1)
        self.assertTrue(len(data["weak_topics"]) >= 1)
        self.assertTrue(len(data["weak_skills"]) >= 1)
        self.assertTrue(len(data["improvement_areas"]) >= 1)
        self.assertTrue(len(data["recommended_next_steps"]) >= 1)

        # Fallback & disclaimer check
        self.assertTrue(data["is_mock_fallback"])
        self.assertEqual(data["generation_mode"], "MOCK_FALLBACK")
        self.assertIn("Formative personal practice", data["disclaimer"])

        # Cached GET returns identical feedback
        get_resp = self.client.get(f"/api/v1/ai-assessments/practice-quiz/{attempt_id}/feedback")
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.json()["attempt_id"], attempt_id)
        self.assertEqual(get_resp.json()["overall_summary"], data["overall_summary"])

    def test_02_incomplete_attempt_rejected(self):
        """Test that feedback request for an incomplete attempt returns HTTP 400."""
        # Create an incomplete attempt directly
        material = LearningMaterial(
            id=uuid.uuid4(),
            title="Draft Material",
            original_filename="draft.pdf",
            stored_filename="draft_stored.pdf",
            file_path="uploads/draft.pdf",
            file_size=100,
            file_type="pdf",
            uploaded_by=self.learner_1.id,
            status="PROCESSED",
            extracted_text="Some text",
        )
        self.db.add(material)
        self.db.commit()

        incomplete_attempt = PracticeQuizAttempt(
            id=uuid.uuid4(),
            user_id=self.learner_1.id,
            learning_material_id=material.id,
            status="IN_PROGRESS",
            total_questions=0,
            submitted_answers=None,
        )
        self.db.add(incomplete_attempt)
        self.db.commit()

        resp = self.client.post(f"/api/v1/ai-assessments/practice-quiz/{incomplete_attempt.id}/feedback")
        err_data = resp.json()
        err_msg = err_data.get("error", {}).get("message", "") or str(err_data.get("detail", ""))
        self.assertIn("not completed", err_msg.lower())

    def test_03_ownership_isolation_blocks_other_learner(self):
        """Verify another learner cannot view or generate feedback for someone else's attempt."""
        material_id, attempt_id, _ = self._upload_test_pdf_and_generate_and_submit(
            self.learner_1, missed_count=1
        )

        # Switch to Learner 2
        self.current_acting_user = self.learner_2

        # 1. POST feedback
        resp_post = self.client.post(f"/api/v1/ai-assessments/practice-quiz/{attempt_id}/feedback")
        self.assertEqual(resp_post.status_code, 403)

        # 2. GET feedback
        resp_get = self.client.get(f"/api/v1/ai-assessments/practice-quiz/{attempt_id}/feedback")
        self.assertEqual(resp_get.status_code, 403)

    def test_04_weak_topics_derived_from_actual_incorrect_answers(self):
        """Verify that weak topics specifically reflect the topics where mistakes occurred."""
        # Create attempt with controlled topic questions
        material = LearningMaterial(
            id=uuid.uuid4(),
            title="Statistical Sampling Guide",
            original_filename="guide.pdf",
            stored_filename="guide_stored.pdf",
            file_path="uploads/guide.pdf",
            file_size=100,
            file_type="pdf",
            uploaded_by=self.learner_1.id,
            status="PROCESSED",
            extracted_text="Sampling content",
        )
        self.db.add(material)
        self.db.commit()

        # Build submitted answers with 2 distinct topics:
        # Topic A ("Python Data Structures"): 2 correct, 0 missed -> Strength
        # Topic B ("Stratified Sampling"): 0 correct, 2 missed -> Weak Topic
        submitted_reviews = [
            {
                "question_id": str(uuid.uuid4()),
                "question_text": "What is a python list?",
                "option_a": "Ordered sequence",
                "option_b": "Set",
                "option_c": "Map",
                "option_d": "Graph",
                "selected_option": "A",
                "correct_option": "A",
                "is_correct": True,
                "explanation": "Lists are ordered sequences.",
                "topic": "Python Data Structures",
                "difficulty": "EASY",
            },
            {
                "question_id": str(uuid.uuid4()),
                "question_text": "What is a python dict?",
                "option_a": "Key-value pairs",
                "option_b": "Tuple",
                "option_c": "Scalar",
                "option_d": "List",
                "selected_option": "A",
                "correct_option": "A",
                "is_correct": True,
                "explanation": "Dicts store key-value mappings.",
                "topic": "Python Data Structures",
                "difficulty": "EASY",
            },
            {
                "question_id": str(uuid.uuid4()),
                "question_text": "How is variance calculated in stratified sampling?",
                "option_a": "Sum of stratum variances",
                "option_b": "Random sample mean",
                "option_c": "Product of strata",
                "option_d": "Inverse weight",
                "selected_option": "B",
                "correct_option": "A",
                "is_correct": False,
                "explanation": "Stratified variance sums weighted stratum variances.",
                "topic": "Stratified Sampling",
                "difficulty": "HARD",
            },
            {
                "question_id": str(uuid.uuid4()),
                "question_text": "When is Neyman allocation optimal?",
                "option_a": "When stratum variances differ",
                "option_b": "When sample sizes are equal",
                "option_c": "When population is infinite",
                "option_d": "Never",
                "selected_option": "B",
                "correct_option": "A",
                "is_correct": False,
                "explanation": "Neyman allocation minimizes variance when stratum standard deviations differ.",
                "topic": "Stratified Sampling",
                "difficulty": "HARD",
            },
        ]

        attempt = PracticeQuizAttempt(
            id=uuid.uuid4(),
            user_id=self.learner_1.id,
            learning_material_id=material.id,
            status="COMPLETED",
            total_questions=4,
            correct_answers=2,
            incorrect_answers=2,
            score=2.0,
            percentage=50.0,
            submitted_answers=submitted_reviews,
        )
        self.db.add(attempt)
        self.db.commit()

        resp = self.client.post(f"/api/v1/ai-assessments/practice-quiz/{attempt.id}/feedback")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        # Weak topics should contain "Stratified Sampling" and NOT "Python Data Structures"
        weak_topic_names = [wt["topic"] for wt in data["weak_topics"]]
        self.assertIn("Stratified Sampling", weak_topic_names)
        self.assertNotIn("Python Data Structures", weak_topic_names)

        strat_weak = next(wt for wt in data["weak_topics"] if wt["topic"] == "Stratified Sampling")
        self.assertEqual(strat_weak["missed_count"], 2)
        self.assertEqual(strat_weak["total_count"], 2)
        self.assertEqual(strat_weak["miss_rate"], 100.0)

        # Python Data Structures should be highlighted under strengths
        strengths_text = " ".join(data["strengths"])
        self.assertIn("Python Data Structures", strengths_text)

    def test_05_existing_competencies_and_courses_reused_no_fake_ids(self):
        """Verify mapped competencies and courses exist in the actual database catalog."""
        material_id, attempt_id, _ = self._upload_test_pdf_and_generate_and_submit(
            self.learner_1, missed_count=2
        )

        resp = self.client.post(f"/api/v1/ai-assessments/practice-quiz/{attempt_id}/feedback")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        # Verify competencies are real DB records
        for comp_ref in data["mapped_competencies"]:
            db_comp = self.db.query(Competency).filter(Competency.id == uuid.UUID(str(comp_ref["id"]))).first()
            self.assertIsNotNone(db_comp, f"Competency {comp_ref['id']} must exist in DB")
            self.assertEqual(db_comp.code, comp_ref["code"])

        # Verify courses are real DB records
        for course_ref in data["recommended_courses"]:
            db_course = self.db.query(Course).filter(Course.id == uuid.UUID(str(course_ref["id"]))).first()
            self.assertIsNotNone(db_course, f"Course {course_ref['id']} must exist in DB")
            self.assertEqual(db_course.title, course_ref["title"])

    def test_06_zero_side_effects_on_official_competencies_or_assessments(self):
        """Ensure generating practice feedback NEVER alters user_competencies or official assessments."""
        initial_competencies = self.db.query(UserCompetency).count()
        initial_assessments = self.db.query(Assessment).count()
        initial_assessment_attempts = self.db.query(AssessmentAttempt).count()

        material_id, attempt_id, _ = self._upload_test_pdf_and_generate_and_submit(
            self.learner_1, missed_count=2
        )

        # Call feedback generation
        resp = self.client.post(f"/api/v1/ai-assessments/practice-quiz/{attempt_id}/feedback")
        self.assertEqual(resp.status_code, 200)

        # Re-check counts
        final_competencies = self.db.query(UserCompetency).count()
        final_assessments = self.db.query(Assessment).count()
        final_assessment_attempts = self.db.query(AssessmentAttempt).count()

        self.assertEqual(initial_competencies, final_competencies)
        self.assertEqual(initial_assessments, final_assessments)
        self.assertEqual(initial_assessment_attempts, final_assessment_attempts)


if __name__ == "__main__":
    print("--- Running Part 10E Learner Practice AI Feedback Test Suite ---")
    unittest.main()
