"""Integration and Unit Test Suite for Part 9A.3: Professional User Profile APIs."""

import os
import sys
import uuid

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
from app.models.department import Department
from app.models.user import User

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


def test_profile_apis():
    print("\n--- 1. Initialize Test DB and Seed Data ---")
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as session:
        seed_database_data(db_session=session)
    print("Database initialized and reference data seeded.")

    # Register and login two test users (User A and User B)
    # User A
    reg_a = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Profile User A",
            "email": "user.a@example.com",
            "password": "Password123",
            "confirm_password": "Password123",
            "phone_number": "+919876543211",
        },
    )
    assert reg_a.status_code == 201
    user_a_data = reg_a.json()

    login_a = client.post(
        "/api/v1/auth/login",
        json={"email": "user.a@example.com", "password": "Password123"},
    )
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User B
    reg_b = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Profile User B",
            "email": "user.b@example.com",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert reg_b.status_code == 201
    login_b = client.post(
        "/api/v1/auth/login",
        json={"email": "user.b@example.com", "password": "Password123"},
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    with TestingSessionLocal() as session:
        sdrd_dept = session.query(Department).filter(Department.code == "SDRD").first()
        assert sdrd_dept is not None

    print("\n--- 2. Test Unauthorized Requests Rejected (Case 5) ---")
    unauth_post = client.post("/api/v1/onboarding/profile", json={"designation": "Analyst"})
    assert unauth_post.status_code == 401, f"Expected 401, got {unauth_post.status_code}"

    unauth_get = client.get("/api/v1/onboarding/profile/me")
    assert unauth_get.status_code == 401, f"Expected 401, got {unauth_get.status_code}"

    unauth_put = client.put("/api/v1/onboarding/profile/me", json={"designation": "Analyst"})
    assert unauth_put.status_code == 401, f"Expected 401, got {unauth_put.status_code}"
    print("Unauthorized requests rejected with HTTP 401.")

    print("\n--- 3. Test GET /profile/me when no profile exists (Case 3b) ---")
    no_prof_res = client.get("/api/v1/onboarding/profile/me", headers=headers_a)
    assert no_prof_res.status_code == 404, f"Expected 404, got {no_prof_res.status_code}: {no_prof_res.text}"
    print("Non-existent profile properly returns HTTP 404.")

    print("\n--- 4. Test Invalid department_id Handled Safely (Case 6) ---")
    fake_dept_id = str(uuid.uuid4())
    invalid_dept_res = client.post(
        "/api/v1/onboarding/profile",
        headers=headers_a,
        json={
            "department_id": fake_dept_id,
            "designation": "Statistical Assistant",
            "employment_type": "GOVERNMENT_OFFICER",
            "experience_years": 2.0,
            "education_level": "BACHELORS",
        },
    )
    assert invalid_dept_res.status_code == 404, f"Expected 404 for invalid department, got {invalid_dept_res.status_code}"
    print("Invalid department_id properly rejected with HTTP 404.")

    print("\n--- 5. Test Authenticated User Creates Profile (Case 1) ---")
    create_payload = {
        "department_id": str(sdrd_dept.id),
        "designation": "Statistical Assistant",
        "employment_type": "GOVERNMENT_OFFICER",
        "experience_years": 3.5,
        "education_level": "MASTERS",
        "specialization": "Economic Statistics",
        "current_work_area": "Household Surveys",
        "location": "Kolkata",
        "bio": "Focused on national sample surveys and sampling techniques.",
    }
    create_res = client.post("/api/v1/onboarding/profile", headers=headers_a, json=create_payload)
    assert create_res.status_code == 201, f"Expected 201 Created, got {create_res.status_code}: {create_res.text}"
    prof_a = create_res.json()

    assert prof_a["user_id"] == user_a_data["id"]
    assert prof_a["department_id"] == str(sdrd_dept.id)
    assert prof_a["designation"] == "Statistical Assistant"
    assert prof_a["employment_type"] == "GOVERNMENT_OFFICER"
    assert prof_a["experience_years"] == 3.5
    assert prof_a["education_level"] == "MASTERS"
    assert prof_a["specialization"] == "Economic Statistics"
    assert prof_a["location"] == "Kolkata"
    assert prof_a["profile_completed"] is True
    assert prof_a["onboarding_step"] == 2
    assert prof_a["skills_completed"] is False
    assert prof_a["onboarding_completed"] is False
    print("Authenticated profile creation succeeded with 201 Created.")

    print("\n--- 6. Test Duplicate Profile Creation Rejected (Case 2) ---")
    dup_res = client.post("/api/v1/onboarding/profile", headers=headers_a, json=create_payload)
    assert dup_res.status_code == 400, f"Expected 400 for duplicate profile, got {dup_res.status_code}: {dup_res.text}"
    print("Duplicate profile creation rejected with HTTP 400.")

    print("\n--- 7. Test GET /profile/me returns own profile (Case 3) ---")
    get_a = client.get("/api/v1/onboarding/profile/me", headers=headers_a)
    assert get_a.status_code == 200
    assert get_a.json()["id"] == prof_a["id"]
    assert get_a.json()["user_id"] == user_a_data["id"]

    # User B still has no profile
    get_b = client.get("/api/v1/onboarding/profile/me", headers=headers_b)
    assert get_b.status_code == 404, "User B should not see User A's profile"
    print("GET /profile/me strictly returns authenticated user's own profile.")

    print("\n--- 8. Test PUT /profile/me updates own profile (Case 4) ---")
    update_payload = {
        "designation": "Senior Statistical Officer",
        "experience_years": 7.0,
        "location": "New Delhi",
        "specialization": "National Accounts & Macroeconomics",
    }
    update_res = client.put("/api/v1/onboarding/profile/me", headers=headers_a, json=update_payload)
    assert update_res.status_code == 200, f"Expected 200, got {update_res.status_code}: {update_res.text}"
    updated_a = update_res.json()

    assert updated_a["designation"] == "Senior Statistical Officer"
    assert updated_a["experience_years"] == 7.0
    assert updated_a["location"] == "New Delhi"
    assert updated_a["specialization"] == "National Accounts & Macroeconomics"
    # Previously set fields preserved
    assert updated_a["employment_type"] == "GOVERNMENT_OFFICER"
    assert updated_a["education_level"] == "MASTERS"
    assert updated_a["profile_completed"] is True
    assert updated_a["skills_completed"] is False
    assert updated_a["onboarding_completed"] is False
    assert updated_a["onboarding_step"] >= 2
    print("PUT /profile/me successfully updated profile and preserved completion flags.")

    print("\n--- 9. Test PUT /profile/me with invalid department_id ---")
    put_invalid_dept = client.put(
        "/api/v1/onboarding/profile/me",
        headers=headers_a,
        json={"department_id": str(uuid.uuid4())},
    )
    assert put_invalid_dept.status_code == 404
    print("PUT /profile/me with invalid department_id safely rejected with 404.")

    print("\n=======================================================")
    print("ALL PART 9A.3 PROFESSIONAL USER PROFILE API TESTS PASSED!")
    print("=======================================================")


if __name__ == "__main__":
    test_profile_apis()
