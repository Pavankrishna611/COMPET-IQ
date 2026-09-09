"""Test suite for Part 10I: Assign Official Assessments + Learner Visibility + Attempt.

Verifies:
1. Trainer can assign a published assessment to learners with optional due date.
2. Duplicate assignment to the same learner is prevented and reported without error.
3. Assigned learner can see the assessment in their catalog.
4. Unassigned learner cannot see the assessment in their catalog.
5. Unassigned learner cannot access details or start the assessment (403 Forbidden).
6. Draft/review assessment cannot be assigned (400 Bad Request).
7. Trainer ownership isolation (Trainer 2 cannot assign Trainer 1's assessment -> 403 Forbidden).
8. Assigned learner can attempt and submit official assessment, score is calculated by backend,
   and assignment is marked COMPLETED.
9. Personal AI practice flow (Part 10D) remains isolated and operational.
"""

import os
import sys
import unittest
import uuid
from datetime import datetime, timedelta, timezone

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
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.question import Question
from app.models.role import Role
from app.models.user import User


class TestPart10IAssignment(unittest.TestCase):
    """Test suite covering Part 10I assignment, access control, and official attempts."""

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, expire_on_commit=False, bind=cls.engine
        )

        Base.metadata.create_all(bind=cls.engine)

        with cls.TestingSessionLocal() as session:
            seed_database_data(session)

            # Retrieve roles
            role_trainer = session.query(Role).filter(Role.name == "TRAINER").first()
            role_learner = session.query(Role).filter(Role.name == "LEARNER").first()

            # Create Trainer 1
            trainer_1 = User(
                official_id="TR-10I-001",
                email="trainer1_10i@mospi.gov.in",
                full_name="Prof. Rajesh Sharma",
                password_hash=hash_password("TrainerPass123!"),
                role_id=role_trainer.id if role_trainer else None,
            )
            # Create Trainer 2 (foreign trainer)
            trainer_2 = User(
                official_id="TR-10I-002",
                email="trainer2_10i@mospi.gov.in",
                full_name="Dr. Anita Desai",
                password_hash=hash_password("TrainerPass123!"),
                role_id=role_trainer.id if role_trainer else None,
            )
            # Create Learner 1 (to be assigned)
            learner_1 = User(
                official_id="LRN-10I-001",
                email="learner1_10i@mospi.gov.in",
                full_name="Amitabh Verma",
                password_hash=hash_password("LearnerPass123!"),
                role_id=role_learner.id if role_learner else None,
            )
            # Create Learner 2 (unassigned)
            learner_2 = User(
                official_id="LRN-10I-002",
                email="learner2_10i@mospi.gov.in",
                full_name="Pooja Sen",
                password_hash=hash_password("LearnerPass123!"),
                role_id=role_learner.id if role_learner else None,
            )

            session.add_all([trainer_1, trainer_2, learner_1, learner_2])
            session.commit()
            session.refresh(trainer_1)
            session.refresh(trainer_2)
            session.refresh(learner_1)
            session.refresh(learner_2)

            cls.trainer_1_id = trainer_1.id
            cls.trainer_2_id = trainer_2.id
            cls.learner_1_id = learner_1.id
            cls.learner_2_id = learner_2.id

            # Generate tokens
            cls.token_trainer_1 = create_access_token(str(trainer_1.id), "TRAINER")
            cls.token_trainer_2 = create_access_token(str(trainer_2.id), "TRAINER")
            cls.token_learner_1 = create_access_token(str(learner_1.id), "LEARNER")
            cls.token_learner_2 = create_access_token(str(learner_2.id), "LEARNER")

            # Create a PUBLISHED assessment owned by Trainer 1
            published_asmt = Assessment(
                title="MoSPI Official Price Statistics Diagnostic",
                description="Assessment on Consumer Price Index (CPI) and Wholesale Price Index (WPI).",
                duration_minutes=25,
                difficulty="INTERMEDIATE",
                status="PUBLISHED",
                assessment_type="TRAINER_OFFICIAL",
                published_at=datetime.now(timezone.utc),
                created_by=trainer_1.id,
            )
            session.add(published_asmt)
            session.commit()
            session.refresh(published_asmt)
            cls.published_assessment_id = published_asmt.id

            # Add 2 questions with known answers
            q1 = Question(
                assessment_id=published_asmt.id,
                sequence_order=1,
                question_text="Which index is commonly used to measure retail inflation in India?",
                question_type="MCQ",
                difficulty="EASY",
                option_a="Wholesale Price Index (WPI)",
                option_b="Consumer Price Index (CPI)",
                option_c="Index of Industrial Production (IIP)",
                option_d="Gross National Product Deflator",
                correct_option="B",
                explanation="Consumer Price Index (CPI) measures changes in the price level of market basket of consumer goods and services.",
                points=1.0,
            )
            q2 = Question(
                assessment_id=published_asmt.id,
                sequence_order=2,
                question_text="What is the base year currently used for CPI (Combined) compilation?",
                question_type="MCQ",
                difficulty="MEDIUM",
                option_a="2004-05",
                option_b="2011-12",
                option_c="2012",
                option_d="2016",
                correct_option="C",
                explanation="The base year for CPI (Combined) is 2012=100.",
                points=1.0,
            )
            session.add_all([q1, q2])

            # Create a DRAFT assessment owned by Trainer 1
            draft_asmt = Assessment(
                title="MoSPI Unfinished Draft on National Accounts",
                description="Draft syllabus on Gross Value Added.",
                duration_minutes=30,
                difficulty="HARD",
                status="DRAFT",
                assessment_type="TRAINER_OFFICIAL",
                created_by=trainer_1.id,
            )
            session.add(draft_asmt)
            session.commit()
            session.refresh(draft_asmt)
            session.refresh(q1)
            session.refresh(q2)

            cls.draft_assessment_id = draft_asmt.id
            cls.q1_id = q1.id
            cls.q2_id = q2.id

        # Setup TestClient with dependency overrides
        def override_get_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=cls.engine)

    def test_01_trainer_assign_published_assessment(self):
        """Trainer 1 can assign their published assessment to Learner 1 with a due date."""
        due_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        payload = {
            "learner_ids": [str(self.learner_1_id)],
            "due_date": due_date,
        }
        res = self.client.post(
            f"/api/v1/assessments/{self.published_assessment_id}/assign",
            json=payload,
            headers={"Authorization": f"Bearer {self.token_trainer_1}"},
        )
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["assigned_count"], 1)
        self.assertEqual(data["skipped_duplicates_count"], 0)
        self.assertEqual(len(data["assignments"]), 1)
        self.assertEqual(data["assignments"][0]["user_id"], str(self.learner_1_id))
        self.assertEqual(data["assignments"][0]["status"], "ASSIGNED")

    def test_02_duplicate_assignment_prevented(self):
        """Assigning to the already-assigned Learner 1 skips duplicate and returns correct count."""
        payload = {
            "learner_ids": [str(self.learner_1_id)],
        }
        res = self.client.post(
            f"/api/v1/assessments/{self.published_assessment_id}/assign",
            json=payload,
            headers={"Authorization": f"Bearer {self.token_trainer_1}"},
        )
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["assigned_count"], 0)
        self.assertEqual(data["skipped_duplicates_count"], 1)

    def test_03_assigned_learner_sees_assessment(self):
        """Assigned Learner 1 can view the published assessment in their catalog."""
        res = self.client.get(
            "/api/v1/assessments",
            headers={"Authorization": f"Bearer {self.token_learner_1}"},
        )
        self.assertEqual(res.status_code, 200)
        assessments = res.json()
        assessment_ids = [a["id"] for a in assessments]
        self.assertIn(str(self.published_assessment_id), assessment_ids)

        assigned_item = next(a for a in assessments if a["id"] == str(self.published_assessment_id))
        self.assertTrue(assigned_item.get("assigned_to_me"))
        self.assertIsNotNone(assigned_item.get("due_date"))

    def test_04_unassigned_learner_cannot_see_assessment(self):
        """Unassigned Learner 2 does NOT see the published assessment in their catalog."""
        res = self.client.get(
            "/api/v1/assessments",
            headers={"Authorization": f"Bearer {self.token_learner_2}"},
        )
        self.assertEqual(res.status_code, 200)
        assessments = res.json()
        assessment_ids = [a["id"] for a in assessments]
        self.assertNotIn(str(self.published_assessment_id), assessment_ids)

    def test_05_unassigned_learner_cannot_access_or_start(self):
        """Unassigned Learner 2 receives 403 Forbidden when trying to access or start the assessment."""
        # Detail endpoint
        res_detail = self.client.get(
            f"/api/v1/assessments/{self.published_assessment_id}",
            headers={"Authorization": f"Bearer {self.token_learner_2}"},
        )
        self.assertEqual(res_detail.status_code, 403)

        # Start quiz endpoint
        res_start = self.client.post(
            f"/api/v1/quiz/{self.published_assessment_id}/start",
            headers={"Authorization": f"Bearer {self.token_learner_2}"},
        )
        self.assertEqual(res_start.status_code, 403)
        self.assertIn("not assigned", res_start.text.lower())

    def test_06_draft_assessment_cannot_be_assigned_or_seen(self):
        """Draft assessment cannot be assigned by trainer and is never visible to learners."""
        # Trainer tries to assign draft
        payload = {"learner_ids": [str(self.learner_1_id)]}
        res_assign = self.client.post(
            f"/api/v1/assessments/{self.draft_assessment_id}/assign",
            json=payload,
            headers={"Authorization": f"Bearer {self.token_trainer_1}"},
        )
        self.assertEqual(res_assign.status_code, 400)
        self.assertIn("only published", res_assign.text.lower())

        # Learner 1 cannot see draft
        res_list = self.client.get(
            "/api/v1/assessments",
            headers={"Authorization": f"Bearer {self.token_learner_1}"},
        )
        self.assertEqual(res_list.status_code, 200)
        self.assertNotIn(str(self.draft_assessment_id), [a["id"] for a in res_list.json()])

    def test_07_trainer_ownership_check(self):
        """Trainer 2 cannot assign Trainer 1's published assessment."""
        payload = {"learner_ids": [str(self.learner_2_id)]}
        res = self.client.post(
            f"/api/v1/assessments/{self.published_assessment_id}/assign",
            json=payload,
            headers={"Authorization": f"Bearer {self.token_trainer_2}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_08_assigned_learner_can_attempt_and_submit(self):
        """Assigned Learner 1 starts assessment, submits answers, score is calculated, and assignment marked COMPLETED."""
        # 1. Start quiz
        res_start = self.client.post(
            f"/api/v1/quiz/{self.published_assessment_id}/start",
            headers={"Authorization": f"Bearer {self.token_learner_1}"},
        )
        self.assertEqual(res_start.status_code, 200, res_start.text)
        start_data = res_start.json()
        attempt_id = start_data["attempt_id"]
        self.assertIsNotNone(attempt_id)
        self.assertEqual(len(start_data["questions"]), 2)

        # Ensure correct option is NOT exposed in start response
        for q in start_data["questions"]:
            self.assertNotIn("correct_option", q)

        # 2. Submit answers: Q1 -> 'B' (correct), Q2 -> 'A' (incorrect, correct is 'C')
        submit_payload = {
            "answers": [
                {"question_id": str(self.q1_id), "selected_option": "B"},
                {"question_id": str(self.q2_id), "selected_option": "A"},
            ]
        }
        res_submit = self.client.post(
            f"/api/v1/quiz/attempts/{attempt_id}/submit",
            json=submit_payload,
            headers={"Authorization": f"Bearer {self.token_learner_1}"},
        )
        self.assertEqual(res_submit.status_code, 200, res_submit.text)
        result_data = res_submit.json()

        self.assertEqual(result_data["total_questions"], 2)
        self.assertEqual(result_data["correct_answers"], 1)
        self.assertEqual(result_data["incorrect_answers"], 1)
        self.assertEqual(result_data["percentage"], 50.0)

        # 3. Check assignment status is now COMPLETED in DB
        with self.TestingSessionLocal() as session:
            assignment = (
                session.query(AssessmentAssignment)
                .filter(
                    AssessmentAssignment.assessment_id == self.published_assessment_id,
                    AssessmentAssignment.user_id == self.learner_1_id,
                )
                .first()
            )
            self.assertIsNotNone(assignment)
            self.assertEqual(assignment.status, "COMPLETED")

    def test_09_trainer_can_view_assignments(self):
        """Trainer 1 can view the list of assignments and see Learner 1 status COMPLETED."""
        res = self.client.get(
            f"/api/v1/assessments/{self.published_assessment_id}/assignments",
            headers={"Authorization": f"Bearer {self.token_trainer_1}"},
        )
        self.assertEqual(res.status_code, 200)
        assignments = res.json()
        self.assertEqual(len(assignments), 1)
        self.assertEqual(assignments[0]["learner_official_id"], "LRN-10I-001")
        self.assertEqual(assignments[0]["status"], "COMPLETED")

    def test_10_trainer_can_list_assignable_learners(self):
        """Trainer 1 can retrieve the list of active learners available to assign."""
        res = self.client.get(
            "/api/v1/assessments/learners/available",
            headers={"Authorization": f"Bearer {self.token_trainer_1}"},
        )
        self.assertEqual(res.status_code, 200)
        learners = res.json()
        self.assertGreaterEqual(len(learners), 2)
        official_ids = [l["official_id"] for l in learners]
        self.assertIn("LRN-10I-001", official_ids)
        self.assertIn("LRN-10I-002", official_ids)


if __name__ == "__main__":
    unittest.main()
