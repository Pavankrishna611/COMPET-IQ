"""Integration and Unit Test Suite for Part 9A.4: Onboarding Status Functionality."""

import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.init_db import seed_database_data
from app.database.session import get_db
from app.main import app
from app.models.user import User
from app.models.user_profile import UserProfile

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


def test_onboarding_status():
    print("\n--- 1. Initialize Test DB and Seed Data ---")
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as session:
        seed_database_data(db_session=session)
    print("Database initialized and demo reference data seeded.")

    print("\n--- 2. Test Unauthorized Request is Rejected (Test 4) ---")
    unauth_res = client.get("/api/v1/onboarding/status")
    assert unauth_res.status_code == 401, f"Expected 401 Unauthorized, got {unauth_res.status_code}"
    print("Unauthorized request properly rejected with HTTP 401.")

    print("\n--- 3. Test New Registered User with No Profile (Test 1) ---")
    reg_new = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "New Onboarding User",
            "email": "new.user@example.com",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert reg_new.status_code == 201

    login_new = client.post(
        "/api/v1/auth/login",
        json={"email": "new.user@example.com", "password": "Password123"},
    )
    token_new = login_new.json()["access_token"]
    headers_new = {"Authorization": f"Bearer {token_new}"}

    status_res = client.get("/api/v1/onboarding/status", headers=headers_new)
    assert status_res.status_code == 200, f"Expected 200, got {status_res.status_code}: {status_res.text}"
    status_data = status_res.json()
    print("Status response for new user:", status_data)

    assert status_data["current_step"] == 1
    assert status_data["profile_completed"] is False
    assert status_data["skills_completed"] is False
    assert status_data["competency_initialized"] is False
    assert status_data["onboarding_completed"] is False
    assert status_data["next_action"] == "Complete your professional profile"
    print("New user with no profile verified at Step 1.")

    print("\n--- 4. Test User with Incomplete Profile (Test 2) ---")
    # Manually create incomplete profile with profile_completed = False
    with TestingSessionLocal() as session:
        user_obj = session.query(User).filter(User.email == "new.user@example.com").first()
        target_user_id = user_obj.id
        inc_profile = UserProfile(
            user_id=target_user_id,
            designation="Draft Officer",
            employment_type="GOVERNMENT_OFFICER",
            experience_years=1.0,
            education_level="BACHELORS",
            profile_completed=False,
            skills_completed=False,
            competency_initialized=False,
            onboarding_completed=False,
            onboarding_step=1,
        )
        session.add(inc_profile)
        session.commit()

    inc_status = client.get("/api/v1/onboarding/status", headers=headers_new)
    assert inc_status.status_code == 200
    inc_data = inc_status.json()
    assert inc_data["current_step"] == 1
    assert inc_data["profile_completed"] is False
    assert inc_data["next_action"] == "Complete your professional profile"
    print("User with incomplete profile verified at Step 1.")

    print("\n--- 5. Test User with Completed Profile (Test 3) ---")
    # Update profile to completed
    with TestingSessionLocal() as session:
        prof = session.query(UserProfile).filter(UserProfile.user_id == target_user_id).first()
        prof.profile_completed = True
        prof.onboarding_step = 2
        session.commit()

    step2_res = client.get("/api/v1/onboarding/status", headers=headers_new)
    assert step2_res.status_code == 200
    step2_data = step2_res.json()
    assert step2_data["current_step"] == 2
    assert step2_data["profile_completed"] is True
    assert step2_data["skills_completed"] is False
    assert step2_data["next_action"] == "Declare your current skills"
    print("User with completed profile verified at Step 2.")

    # 5b. Skills completed -> Step 3
    with TestingSessionLocal() as session:
        prof = session.query(UserProfile).filter(UserProfile.user_id == target_user_id).first()
        prof.skills_completed = True
        prof.onboarding_step = 3
        session.commit()

    step3_res = client.get("/api/v1/onboarding/status", headers=headers_new)
    assert step3_res.status_code == 200
    step3_data = step3_res.json()
    assert step3_data["current_step"] == 3
    assert step3_data["skills_completed"] is True
    assert step3_data["competency_initialized"] is False
    assert step3_data["next_action"] == "Initialize your competency profile"
    print("User with skills declared verified at Step 3.")

    # 5c. Competencies initialized -> Step 4
    with TestingSessionLocal() as session:
        prof = session.query(UserProfile).filter(UserProfile.user_id == target_user_id).first()
        prof.competency_initialized = True
        prof.onboarding_step = 4
        session.commit()

    step4_res = client.get("/api/v1/onboarding/status", headers=headers_new)
    assert step4_res.status_code == 200
    step4_data = step4_res.json()
    assert step4_data["current_step"] == 4
    assert step4_data["competency_initialized"] is True
    assert step4_data["onboarding_completed"] is False
    assert step4_data["next_action"] == "Review your competency profile and complete onboarding"
    print("User with initialized competencies verified at Step 4.")

    # 5d. Onboarding completed -> Step 5
    with TestingSessionLocal() as session:
        prof = session.query(UserProfile).filter(UserProfile.user_id == target_user_id).first()
        prof.onboarding_completed = True
        prof.onboarding_step = 5
        session.commit()

    step5_res = client.get("/api/v1/onboarding/status", headers=headers_new)
    assert step5_res.status_code == 200
    step5_data = step5_res.json()
    assert step5_data["current_step"] == 5
    assert step5_data["onboarding_completed"] is True
    assert step5_data["next_action"] == "Go to your COMPETIQ dashboard"
    print("User with onboarding complete verified at Step 5.")

    print("\n--- 6. Test Existing Demo Users Without Profiles (Test 5) ---")
    # Login as demo admin (priya.sharma@mospi.gov.in) who has no UserProfile created
    demo_login = client.post(
        "/api/v1/auth/login",
        json={"email": "priya.sharma@mospi.gov.in", "password": "demo123"},
    )
    assert demo_login.status_code == 200
    demo_token = demo_login.json()["access_token"]
    demo_headers = {"Authorization": f"Bearer {demo_token}"}

    demo_status_res = client.get("/api/v1/onboarding/status", headers=demo_headers)
    assert demo_status_res.status_code == 200
    demo_status = demo_status_res.json()
    assert demo_status["current_step"] == 1
    assert demo_status["profile_completed"] is False
    assert demo_status["next_action"] == "Complete your professional profile"
    print("Existing demo user without profile verified at Step 1 without errors.")

    print("\n=======================================================")
    print("ALL PART 9A.4 ONBOARDING STATUS TESTS PASSED!")
    print("=======================================================")


if __name__ == "__main__":
    test_onboarding_status()
