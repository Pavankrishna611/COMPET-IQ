"""Test suite for Part 9D: Competency Evaluation & Skill Gap Analysis."""

import os
import sys
import unittest
import uuid
from typing import Dict

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.database.base import Base
from app.database.init_db import seed_database_data
from app.database.session import get_db
from app.main import app
from app.models.assessment import Assessment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.competency import Competency
from app.models.question import Question
from app.models.question_attempt import QuestionAttempt
from app.models.role import Role
from app.models.role_competency import RoleCompetencyRequirement
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.models.user_profile import UserProfile
from app.models.user_skill_declaration import UserSkillDeclaration

# In-memory SQLite for test isolation
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


class TestPart9DCompetencyEvaluation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        db = TestingSessionLocal()
        seed_database_data(db)
        db.close()

    def setUp(self):
        self.db = TestingSessionLocal()

    def tearDown(self):
        self.db.close()

    def register_and_login(self, email_prefix: str) -> Dict[str, str]:
        email = f"{email_prefix}_{uuid.uuid4().hex[:6]}@example.gov.in"
        reg_payload = {
            "email": email,
            "password": "Password123!",
            "confirm_password": "Password123!",
            "full_name": "Test Officer",
        }
        res_reg = client.post("/api/v1/auth/register", json=reg_payload)
        self.assertEqual(res_reg.status_code, 201, f"Registration failed: {res_reg.text}")

        login_payload = {
            "email": email,
            "password": "Password123!",
        }
        res_login = client.post("/api/v1/auth/login", json=login_payload)
        self.assertEqual(res_login.status_code, 200, f"Login failed: {res_login.text}")
        token = res_login.json()["access_token"]
        return {"Authorization": f"Bearer {token}", "email": email}

    def test_01_new_learner_evaluation_flow(self):
        """Verify full evaluation flow for newly registered learner with INITIAL_ESTIMATE source."""
        headers = self.register_and_login("new_learner_eval")

        # 1. Save professional profile
        prof_payload = {
            "department": "National Accounts Division",
            "designation": "Statistical Officer",
            "job_role": "Data Analyst",
            "current_assignment": "Quarterly GDP compilation and price index aggregation",
            "experience_years": 3.0,
            "education_level": "MASTERS",
            "specialization": "Statistics",
            "career_goal": "Master advanced statistical analytics and Python",
        }
        res_prof = client.post("/api/v1/onboarding/profile", headers=headers, json=prof_payload)
        self.assertEqual(res_prof.status_code, 201)

        # 2. Get AI suggestions
        res_sug = client.post("/api/v1/onboarding/analyze-profile", headers=headers)
        self.assertEqual(res_sug.status_code, 200)
        suggestions = res_sug.json()
        self.assertGreaterEqual(len(suggestions), 2)

        # 3. Accept suggestions
        accept_payload = {
            "competencies": [
                {
                    "competency_id": suggestions[0]["competency_id"],
                    "competency_name": suggestions[0]["competency_name"],
                    "domain": suggestions[0]["domain"],
                    "required_level": suggestions[0]["required_level"],
                    "priority": suggestions[0]["priority"],
                },
                {
                    "competency_id": suggestions[1]["competency_id"],
                    "competency_name": suggestions[1]["competency_name"],
                    "domain": suggestions[1]["domain"],
                    "required_level": suggestions[1]["required_level"],
                    "priority": suggestions[1]["priority"],
                },
            ]
        }
        res_acc = client.post("/api/v1/onboarding/accept-competencies", headers=headers, json=accept_payload)
        self.assertEqual(res_acc.status_code, 200)

        # 4. Trigger Competency Evaluation (Part 9D)
        res_eval = client.post("/api/v1/onboarding/evaluate-competencies", headers=headers)
        self.assertEqual(res_eval.status_code, 200)
        data = res_eval.json()

        # Verify learner profile details
        self.assertIn("learner_profile", data)
        self.assertEqual(data["learner_profile"]["job_role"], "Data Analyst")
        self.assertEqual(data["learner_profile"]["department"], "National Accounts Division")

        # Verify summary
        summary = data["summary"]
        self.assertEqual(summary["total_competencies"], 2)
        self.assertGreaterEqual(summary["average_required_level"], 3.0)
        self.assertGreaterEqual(summary["average_current_level"], 1.0)

        # Verify competency items
        items = data["competencies"]
        self.assertEqual(len(items), 2)
        for item in items:
            # Must be marked as INITIAL_ESTIMATE since no assessment history exists
            self.assertEqual(item["current_level_source"], "INITIAL_ESTIMATE")
            # Gap must be non-negative
            self.assertGreaterEqual(item["gap"], 0.0)
            self.assertEqual(item["gap"], round(max(0.0, item["required_level"] - item["current_level"]), 1))
            # Valid priority
            self.assertIn(item["priority"], {"CRITICAL", "HIGH", "MEDIUM", "LOW", "MET"})
            # Explainability fields
            self.assertTrue(len(item["why_required"]) > 10)
            self.assertIn("Initial estimate", item["evidence"])

        # 5. Verify database persistence in UserCompetency
        db_user = self.db.query(User).filter(User.email == headers["email"]).first()
        persisted_comps = self.db.query(UserCompetency).filter(UserCompetency.user_id == db_user.id).all()
        self.assertEqual(len(persisted_comps), 2)
        for pc in persisted_comps:
            self.assertEqual(pc.evidence_source, "INITIAL_ESTIMATE")
            self.assertIsNotNone(pc.evaluation_date)
            self.assertGreater(pc.required_level, 0.0)
            self.assertGreaterEqual(pc.gap, 0.0)

    def test_02_assessed_evidence_takes_precedence(self):
        """Verify that objective assessment scores take precedence over initial estimates."""
        headers = self.register_and_login("assessed_learner")

        # Find Python competency
        py_comp = self.db.query(Competency).filter(Competency.code == "TECH_PY").first()
        self.assertIsNotNone(py_comp)

        # Save profile
        prof_payload = {
            "department": "Computer Centre",
            "designation": "Programmer",
            "job_role": "Data Analyst",
            "experience_years": 2.0,
            "career_goal": "Python Mastery",
        }
        client.post("/api/v1/onboarding/profile", headers=headers, json=prof_payload)

        # Declare Python skill
        client.post(
            "/api/v1/onboarding/accept-competencies",
            headers=headers,
            json={"competencies": [{"competency_id": str(py_comp.id), "competency_name": "Python"}]},
        )

        # Inject assessment attempt with 90% score on Python
        db_user = self.db.query(User).filter(User.email == headers["email"]).first()
        assessment = self.db.query(Assessment).first()
        attempt = AssessmentAttempt(
            assessment_id=assessment.id,
            user_id=db_user.id,
            status="COMPLETED",
            score=9.0,
            percentage=90.0,
        )
        self.db.add(attempt)
        self.db.commit()

        # Add question and question attempt linked to py_comp
        q = Question(
            assessment_id=assessment.id,
            competency_id=py_comp.id,
            question_text="Sample Python Question",
            points=10.0,
            option_a="A",
            option_b="B",
            option_c="C",
            option_d="D",
            correct_option="A",
        )
        self.db.add(q)
        self.db.commit()

        qa = QuestionAttempt(
            attempt_id=attempt.id,
            question_id=q.id,
            selected_option="A",
            is_correct=True,
            points_earned=9.0,
        )
        self.db.add(qa)
        self.db.commit()

        # Run competency evaluation
        res_eval = client.get("/api/v1/onboarding/competency-evaluation", headers=headers)
        self.assertEqual(res_eval.status_code, 200)
        data = res_eval.json()

        py_item = next(item for item in data["competencies"] if item["competency_id"] == str(py_comp.id))
        self.assertEqual(py_item["current_level_source"], "ASSESSED")
        self.assertGreaterEqual(py_item["current_level"], 4.0)
        self.assertIn("assessment performance", py_item["evidence"])

    def test_03_requirement_met_non_negative_gap(self):
        """Verify that when current_level >= required_level, gap is 0.0 and status is requirement met."""
        headers = self.register_and_login("met_learner")

        py_comp = self.db.query(Competency).filter(Competency.code == "TECH_PY").first()
        client.post(
            "/api/v1/onboarding/profile",
            headers=headers,
            json={"department": "IT", "designation": "Lead Developer", "experience_years": 8.0},
        )
        client.post(
            "/api/v1/onboarding/accept-competencies",
            headers=headers,
            json={"competencies": [{"competency_id": str(py_comp.id)}]},
        )

        # Set user competency directly to level 5.0
        db_user = self.db.query(User).filter(User.email == headers["email"]).first()
        uc = self.db.query(UserCompetency).filter(UserCompetency.user_id == db_user.id, UserCompetency.competency_id == py_comp.id).first()
        if uc:
            uc.current_level = 5.0
            uc.last_assessed_at = None
        else:
            uc = UserCompetency(user_id=db_user.id, competency_id=py_comp.id, current_level=5.0)
            self.db.add(uc)
        self.db.commit()

        res_eval = client.post("/api/v1/onboarding/evaluate-competencies", headers=headers)
        self.assertEqual(res_eval.status_code, 200)
        data = res_eval.json()

        py_item = next(item for item in data["competencies"] if item["competency_id"] == str(py_comp.id))
        self.assertEqual(py_item["gap"], 0.0)
        self.assertTrue(py_item["requirement_met"])
        self.assertEqual(py_item["priority"], "MET")

    def test_04_evaluation_fails_without_accepted_competencies(self):
        """Verify 400 Bad Request if user attempts evaluation without accepted competencies."""
        headers = self.register_and_login("empty_learner")
        res = client.post("/api/v1/onboarding/evaluate-competencies", headers=headers)
        self.assertEqual(res.status_code, 400)


if __name__ == "__main__":
    unittest.main(verbosity=2)
