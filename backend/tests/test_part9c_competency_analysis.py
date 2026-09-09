"""Test suite for Part 9C: AI-based Professional Profile Analysis and Competency Suggestion."""

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
from app.models.competency import Competency
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.user_skill_declaration import UserSkillDeclaration
from app.services.competency_analysis_service import (
    CompetencyAnalysisService,
    LearnerProfileContext,
    _matches_keyword,
)

# In-memory SQLite for comprehensive test isolation
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


class TestPart9CCompetencyAnalysis(unittest.TestCase):
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

    def test_01_matches_keyword_word_boundary_safety(self):
        """Verify that single-letter and short tokens do not falsely match substrings."""
        # Single-letter token 'r'
        self.assertFalse(_matches_keyword("r", "I want to improve my data skills and lead projects"))
        self.assertTrue(_matches_keyword("r", "I want to learn R and Python for data science"))
        self.assertTrue(_matches_keyword("r", "Proficient in R"))

        # Short acronym 'gis'
        self.assertFalse(_matches_keyword("gis", "Please register for this course"))
        self.assertTrue(_matches_keyword("gis", "Experienced in GIS mapping and spatial data"))

        # Short acronym 'sql'
        self.assertFalse(_matches_keyword("sql", "nosql databases and more"))
        self.assertTrue(_matches_keyword("sql", "Writing complex SQL queries for analytics"))

    def test_02_contextual_engine_differentiates_profiles(self):
        """Verify that distinct learner profiles receive differentiated, role-specific recommendations."""
        all_comps = self.db.query(Competency).all()
        self.assertGreaterEqual(len(all_comps), 22, "Expected at least 22 seeded competencies.")

        # Profile 1: Economic Statistician in National Accounts
        prof_econ = LearnerProfileContext(
            designation="Senior Statistical Officer",
            department="National Accounts Division",
            job_role="National Accounts Compiler",
            current_assignment="Compiling quarterly GDP estimates and price index reconciliation",
            education_level="MASTERS",
            specialization="Economics",
            experience_years=6.0,
            current_work_area="National Accounts & Price Statistics",
            previous_trainings="National Accounting Standards",
            career_goal="Master national accounts methodology and macro-level price statistics",
        )
        recs_econ = CompetencyAnalysisService._analyze_with_contextual_engine(
            profile_ctx=prof_econ, competencies=all_comps
        )
        econ_names = [r.competency_name for r in recs_econ]
        self.assertIn("National Accounts", econ_names)
        self.assertIn("Price Statistics", econ_names)

        # Profile 2: Field Investigator in Survey Operations
        prof_field = LearnerProfileContext(
            designation="Junior Statistical Officer",
            department="Field Operations Division",
            job_role="Field Investigator",
            current_assignment="Household consumer expenditure survey data collection and GIS boundary verification",
            education_level="BACHELORS",
            specialization="Statistics",
            experience_years=2.0,
            current_work_area="Field Surveys",
            previous_trainings="CAPI Data Entry",
            career_goal="Master survey design, sampling strategies, and GIS enumeration",
        )
        recs_field = CompetencyAnalysisService._analyze_with_contextual_engine(
            profile_ctx=prof_field, competencies=all_comps
        )
        field_names = [r.competency_name for r in recs_field]
        self.assertTrue("Survey Design" in field_names or "Sampling" in field_names)
        self.assertIn("GIS", field_names)

        # Profile 3: Data Analyst in IT Division
        prof_it = LearnerProfileContext(
            designation="Assistant Director",
            department="Computer Centre",
            job_role="Data Analyst",
            current_assignment="Developing automated Python ETL pipelines and SQL dashboards",
            education_level="MASTERS",
            specialization="Computer Science",
            experience_years=4.5,
            current_work_area="Data Management & Analytics",
            previous_trainings="Relational Databases",
            career_goal="Lead AI and machine learning initiatives with Python and cloud infrastructure",
        )
        recs_it = CompetencyAnalysisService._analyze_with_contextual_engine(
            profile_ctx=prof_it, competencies=all_comps
        )
        it_names = [r.competency_name for r in recs_it]
        self.assertIn("Python", it_names)
        self.assertTrue("AI / Machine Learning" in it_names or "SQL" in it_names)

    def test_03_recommendations_conform_to_framework_schema(self):
        """Verify that all recommendations strictly map to database competencies with valid schema."""
        all_comps = self.db.query(Competency).all()
        comp_id_map = {c.id: c for c in all_comps}

        prof = LearnerProfileContext(
            designation="Statistical Officer",
            department="Social Statistics Division",
            job_role="Survey Analyst",
            current_assignment="Periodic Labour Force Survey data validation and scrutiny",
            education_level="MASTERS",
            specialization="Statistics",
            experience_years=3.5,
            current_work_area="Labour & Employment",
            career_goal="Enhance labour statistics analysis and survey data quality",
        )
        recs = CompetencyAnalysisService._analyze_with_contextual_engine(
            profile_ctx=prof, competencies=all_comps
        )

        self.assertGreaterEqual(len(recs), 4, "Should return at least 4 suggested competencies.")
        self.assertLessEqual(len(recs), 6, "Should return at most 6 suggested competencies.")

        for r in recs:
            # 1. Official competency ID exists in DB
            self.assertIn(r.competency_id, comp_id_map)
            comp_db = comp_id_map[r.competency_id]
            self.assertEqual(r.competency_name, comp_db.name)
            self.assertEqual(r.domain, comp_db.domain)

            # 2. Priority is valid enum
            self.assertIn(r.priority, {"CRITICAL", "HIGH", "MEDIUM"})

            # 3. Required level is between 1.0 and 5.0
            self.assertGreaterEqual(r.required_level, 1.0)
            self.assertLessEqual(r.required_level, 5.0)

            # 4. Relevance reason is non-empty
            self.assertTrue(len(r.relevance_reason.strip()) > 10)

    def test_04_analyze_profile_endpoint_with_saved_profile(self):
        """Verify POST /onboarding/analyze-profile uses saved UserProfile from DB."""
        headers = self.register_and_login("prof_saved")

        # Save profile first
        profile_payload = {
            "department": "Economic Statistics Division",
            "designation": "Deputy Director",
            "job_role": "Price Index Analyst",
            "current_assignment": "CPI index calculation and price collection oversight",
            "employment_type": "GOVERNMENT_OFFICER",
            "experience_years": 8.0,
            "education_level": "MASTERS",
            "specialization": "Economics",
            "current_work_area": "Price Indices",
            "previous_trainings": "Index Number Theory",
            "career_goal": "Lead modern digital price statistics and macro indicators",
        }
        res_p = client.post("/api/v1/onboarding/profile", headers=headers, json=profile_payload)
        self.assertEqual(res_p.status_code, 201)

        # Call analyze-profile without body
        res_a = client.post("/api/v1/onboarding/analyze-profile", headers=headers)
        self.assertEqual(res_a.status_code, 200)
        recs = res_a.json()
        self.assertIsInstance(recs, list)
        self.assertGreaterEqual(len(recs), 4)

        names = [item["competency_name"] for item in recs]
        self.assertIn("Price Statistics", names)

    def test_05_analyze_profile_endpoint_with_override_body(self):
        """Verify POST /onboarding/analyze-profile accepts dynamic ProfileAnalysisRequest body."""
        headers = self.register_and_login("prof_override")

        override_payload = {
            "department": "Cybersecurity & IT Infrastructure",
            "designation": "Systems Officer",
            "job_role": "Information Security Administrator",
            "current_assignment": "Implementing DPDP Act data privacy controls and secure cloud migration",
            "experience_years": 5.0,
            "education_level": "BACHELORS",
            "specialization": "Computer Science",
            "career_goal": "Strengthen government cloud and data privacy compliance",
        }
        res = client.post("/api/v1/onboarding/analyze-profile", headers=headers, json=override_payload)
        self.assertEqual(res.status_code, 200)
        recs = res.json()
        self.assertGreaterEqual(len(recs), 4)

        names = [item["competency_name"] for item in recs]
        self.assertTrue("Data Privacy" in names or "Cybersecurity" in names or "Government Cloud" in names)

    def test_06_accept_competencies_endpoint_persists_skills(self):
        """Verify POST /onboarding/accept-competencies stores items in UserSkillDeclaration and advances onboarding."""
        headers = self.register_and_login("accept_learner")

        # Save profile
        profile_payload = {
            "department": "Field Operations Division",
            "designation": "Statistical Investigator",
            "job_role": "Field Operations",
            "current_assignment": "Survey data validation",
            "experience_years": 3.0,
            "education_level": "BACHELORS",
            "career_goal": "Master data quality and survey sampling",
        }
        res_p = client.post("/api/v1/onboarding/profile", headers=headers, json=profile_payload)
        self.assertEqual(res_p.status_code, 201)

        # Request suggestions
        res_a = client.post("/api/v1/onboarding/analyze-profile", headers=headers)
        self.assertEqual(res_a.status_code, 200)
        suggestions = res_a.json()
        self.assertGreaterEqual(len(suggestions), 2)

        # Learner accepts 2 competencies
        accepted_items = [
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
        accept_payload = {"competencies": accepted_items}

        res_accept = client.post(
            "/api/v1/onboarding/accept-competencies",
            headers=headers,
            json=accept_payload,
        )
        self.assertEqual(res_accept.status_code, 200)
        data = res_accept.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["saved_count"], 2)

        # Check declared skills via GET /onboarding/skills/me
        res_skills = client.post("/api/v1/onboarding/skills", headers=headers)  # just check endpoint
        res_my_skills = client.get("/api/v1/onboarding/skills/me", headers=headers)
        self.assertEqual(res_my_skills.status_code, 200)
        declared_list = res_my_skills.json()
        self.assertEqual(len(declared_list), 2)
        saved_comp_ids = {s["competency_id"] for s in declared_list}
        self.assertIn(suggestions[0]["competency_id"], saved_comp_ids)
        self.assertIn(suggestions[1]["competency_id"], saved_comp_ids)

        # Verify onboarding status: skills_completed=True, current_step >= 3
        res_status = client.get("/api/v1/onboarding/status", headers=headers)
        self.assertEqual(res_status.status_code, 200)
        status_data = res_status.json()
        self.assertTrue(status_data["skills_completed"])
        self.assertGreaterEqual(status_data["current_step"], 3)

    def test_07_accept_competencies_validation(self):
        """Verify validation: empty list is 400, unknown competency ID is 404."""
        headers = self.register_and_login("accept_val")

        # Empty list
        res_empty = client.post(
            "/api/v1/onboarding/accept-competencies",
            headers=headers,
            json={"competencies": []},
        )
        self.assertEqual(res_empty.status_code, 400)

        # Fake UUID
        res_fake = client.post(
            "/api/v1/onboarding/accept-competencies",
            headers=headers,
            json={"competencies": [{"competency_id": str(uuid.uuid4())}]},
        )
        self.assertEqual(res_fake.status_code, 404)


if __name__ == "__main__":
    unittest.main(verbosity=2)
