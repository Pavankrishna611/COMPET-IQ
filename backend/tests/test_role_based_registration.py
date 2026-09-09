"""Test suite for Role-Based Registration (Learner, Trainer, and Admin rejection)."""

import os
import sys
import unittest

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import verify_password
from app.database.base import Base
from app.database.init_db import seed_database_data
from app.database.session import get_db
from app.main import app
from app.models.role import Role
from app.models.user import User
from app.models.user_profile import UserProfile

# In-memory SQLite engine for isolated test run
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


class TestRoleBasedRegistration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        with TestingSessionLocal() as session:
            seed_database_data(db_session=session)
        cls.client = TestClient(app)

    def test_01_learner_registration_default_role(self):
        """Learner registers without explicit role parameter -> defaults to LEARNER with LRN- id."""
        payload = {
            "full_name": "Kavita Sharma",
            "email": "kavita.learner@example.com",
            "password": "LearnerPass1",
            "confirm_password": "LearnerPass1",
        }
        res = self.client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(res.status_code, 201, res.text)
        data = res.json()
        self.assertEqual(data["full_name"], "Kavita Sharma")
        self.assertEqual(data["email"], "kavita.learner@example.com")
        self.assertTrue(data["official_id"].startswith("LRN-"))
        self.assertEqual(data["role"]["name"], "LEARNER")

        # Verify login
        login_res = self.client.post(
            "/api/v1/auth/login",
            json={"email": "kavita.learner@example.com", "password": "LearnerPass1"},
        )
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertIn("access_token", login_data)
        self.assertEqual(login_data["user"]["role"], "LEARNER")

    def test_02_learner_registration_explicit_role(self):
        """Learner registers with explicit role='LEARNER'."""
        payload = {
            "full_name": "Amit Patel",
            "email": "amit.patel@example.com",
            "password": "LearnerPass2",
            "confirm_password": "LearnerPass2",
            "role": "LEARNER",
        }
        res = self.client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(res.status_code, 201, res.text)
        data = res.json()
        self.assertEqual(data["role"]["name"], "LEARNER")
        self.assertTrue(data["official_id"].startswith("LRN-"))

    def test_03_trainer_registration_with_metadata(self):
        """Trainer registers with role='TRAINER', designation, department, organization, and job_role."""
        payload = {
            "full_name": "Dr. Vikram Seth",
            "email": "vikram.seth@training.gov.in",
            "password": "TrainerPassword1",
            "confirm_password": "TrainerPassword1",
            "role": "TRAINER",
            "designation": "Senior Statistical Officer & Master Trainer",
            "department": "National Accounts Division",
            "organization": "Central Training Institute",
            "job_role": "Lead Faculty",
        }
        res = self.client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(res.status_code, 201, res.text)
        data = res.json()

        self.assertEqual(data["full_name"], "Dr. Vikram Seth")
        self.assertEqual(data["email"], "vikram.seth@training.gov.in")
        self.assertEqual(data["role"]["name"], "TRAINER")
        self.assertTrue(
            data["official_id"].startswith("TRN-"),
            f"Expected official_id starting with TRN-, got: {data['official_id']}",
        )
        self.assertEqual(data["designation"], "Senior Statistical Officer & Master Trainer")

        # Verify UserProfile created and linked in database
        with TestingSessionLocal() as session:
            trainer_user = session.query(User).filter(User.email == "vikram.seth@training.gov.in").first()
            self.assertIsNotNone(trainer_user)
            self.assertEqual(trainer_user.role.name, "TRAINER")

            profile = session.query(UserProfile).filter(UserProfile.user_id == trainer_user.id).first()
            self.assertIsNotNone(profile, "UserProfile should be created for registered trainer")
            self.assertEqual(profile.job_role, "Lead Faculty")
            self.assertEqual(profile.current_assignment, "Central Training Institute")
            self.assertTrue(profile.profile_completed)

        # Verify trainer login returns TRAINER role
        login_res = self.client.post(
            "/api/v1/auth/login",
            json={"email": "vikram.seth@training.gov.in", "password": "TrainerPassword1"},
        )
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertIn("access_token", login_data)
        self.assertEqual(login_data["user"]["role"], "TRAINER")

    def test_04_admin_registration_rejected(self):
        """Attempting public registration with role='ADMIN' is rejected."""
        payload = {
            "full_name": "Unauthorized Admin",
            "email": "hacker.admin@example.com",
            "password": "AdminPassword1",
            "confirm_password": "AdminPassword1",
            "role": "ADMIN",
        }
        res = self.client.post("/api/v1/auth/register", json=payload)
        # Pydantic field_validator rejects with 422 Unprocessable Entity
        self.assertIn(res.status_code, [403, 422])
        self.assertIn("Public registration cannot assign administrative roles", res.text)

    def test_05_admin_role_id_injection_rejected(self):
        """Attempting to inject an ADMIN role_id directly is blocked with 403 Forbidden."""
        with TestingSessionLocal() as session:
            admin_role = session.query(Role).filter(Role.name == "ADMIN").first()
            self.assertIsNotNone(admin_role)
            admin_role_id = str(admin_role.id)

        payload = {
            "full_name": "Injected Admin",
            "email": "injected.admin@example.com",
            "password": "Password123",
            "confirm_password": "Password123",
            "role_id": admin_role_id,
        }
        res = self.client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Public registration cannot assign administrative roles", res.text)

    def test_06_password_complexity_rules(self):
        """Weak passwords (missing upper/lower/digit or too short) are rejected."""
        # Too short (< 8 chars)
        res1 = self.client.post(
            "/api/v1/auth/register",
            json={"full_name": "Short Pass", "email": "short@test.com", "password": "P1a", "confirm_password": "P1a"},
        )
        self.assertEqual(res1.status_code, 422)

        # Missing uppercase
        res2 = self.client.post(
            "/api/v1/auth/register",
            json={"full_name": "No Upper", "email": "noupper@test.com", "password": "password123", "confirm_password": "password123"},
        )
        self.assertEqual(res2.status_code, 422)

        # Mismatch confirm_password
        res3 = self.client.post(
            "/api/v1/auth/register",
            json={"full_name": "Mismatch", "email": "mismatch@test.com", "password": "ValidPassword1", "confirm_password": "DifferentPassword1"},
        )
        self.assertEqual(res3.status_code, 422)


if __name__ == "__main__":
    unittest.main()
