"""Test suite for Part 9A.1: Public User Registration."""

import os
import sys

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


def test_public_user_registration():
    print("\n--- 1. Initialize DB and Seed Base Data ---")
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as session:
        seed_database_data(db_session=session)
    print("Database initialized and seeded.")

    print("\n--- 2. Test Successful Public Registration with all fields ---")
    reg_payload = {
        "full_name": "Rohan Deshmukh",
        "email": "rohan.deshmukh@example.com",
        "password": "SecurePassword1",
        "confirm_password": "SecurePassword1",
        "phone_number": "+919876543210",
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201, f"Expected 201 Created, got {res.status_code}: {res.text}"
    user_data = res.json()
    print("Registration response:", user_data)

    # Verification of safe user info (Requirement 9)
    assert "password" not in user_data, "Plaintext password must NEVER be in response"
    assert "password_hash" not in user_data, "Password hash must NEVER be in response"
    assert user_data["full_name"] == "Rohan Deshmukh"
    assert user_data["email"] == "rohan.deshmukh@example.com"
    assert user_data["phone_number"] == "+919876543210"
    assert user_data["official_id"].startswith("LRN-"), f"Expected auto-generated official_id starting with LRN-, got {user_data['official_id']}"

    # Verification of LEARNER role (Requirement 7)
    assert user_data["role"] is not None
    assert user_data["role"]["name"] == "LEARNER", f"Expected LEARNER role, got {user_data['role']['name']}"

    # Verify password securely hashed in DB (Requirements 5 & 6)
    with TestingSessionLocal() as session:
        db_user = session.query(User).filter(User.email == "rohan.deshmukh@example.com").first()
        assert db_user is not None
        assert db_user.password_hash != "SecurePassword1", "Password hash must not be plaintext"
        assert verify_password("SecurePassword1", db_user.password_hash) is True
        assert db_user.role.name == "LEARNER"
    print("Successful registration and safe user response verified.")

    print("\n--- 3. Test Successful Public Registration with optional phone_number omitted ---")
    reg_no_phone = {
        "full_name": "Ananya Roy",
        "email": "ananya.roy@example.com",
        "password": "Password2026",
        "confirm_password": "Password2026",
    }
    res = client.post("/api/v1/auth/register", json=reg_no_phone)
    assert res.status_code == 201, f"Expected 201 Created, got {res.status_code}: {res.text}"
    assert res.json()["phone_number"] is None
    print("Registration with optional phone_number omitted succeeded.")

    print("\n--- 4. Test Login with Newly Registered User ---")
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "rohan.deshmukh@example.com", "password": "SecurePassword1"},
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token_data = login_res.json()
    assert token_data["access_token"] is not None
    assert token_data["user"]["role"] == "LEARNER"
    print("Login with new credentials succeeded.")

    print("\n--- 5. Test Duplicate Email Rejection (Requirement 1) ---")
    dup_res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Duplicate Rohan",
            "email": "ROHAN.DESHMUKH@EXAMPLE.COM",  # Case insensitive duplicate
            "password": "AnotherPassword2",
            "confirm_password": "AnotherPassword2",
        },
    )
    assert dup_res.status_code == 400, f"Expected 400 for duplicate email, got {dup_res.status_code}: {dup_res.text}"
    print("Duplicate email properly rejected with HTTP 400.")

    print("\n--- 6. Test Password Confirmation Mismatch (Requirement 4) ---")
    mismatch_res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Mismatch Test",
            "email": "mismatch@example.com",
            "password": "ValidPassword1",
            "confirm_password": "DifferentPassword2",
        },
    )
    assert mismatch_res.status_code in [400, 422], f"Expected 400/422, got {mismatch_res.status_code}"
    print("Password mismatch properly rejected.")

    print("\n--- 7. Test Password Complexity Validation (Requirements 2 & 3) ---")
    # 7a. Too short (< 8 chars)
    short_res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Short Pass",
            "email": "short@example.com",
            "password": "Pass1",
            "confirm_password": "Pass1",
        },
    )
    assert short_res.status_code == 422, f"Expected 422 for short password, got {short_res.status_code}"

    # 7b. Missing uppercase
    no_upper_res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "No Upper",
            "email": "noupper@example.com",
            "password": "password123",
            "confirm_password": "password123",
        },
    )
    assert no_upper_res.status_code == 422, f"Expected 422 for missing uppercase, got {no_upper_res.status_code}"

    # 7c. Missing lowercase
    no_lower_res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "No Lower",
            "email": "nolower@example.com",
            "password": "PASSWORD123",
            "confirm_password": "PASSWORD123",
        },
    )
    assert no_lower_res.status_code == 422, f"Expected 422 for missing lowercase, got {no_lower_res.status_code}"

    # 7d. Missing digit
    no_digit_res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "No Digit",
            "email": "nodigit@example.com",
            "password": "PasswordOnly",
            "confirm_password": "PasswordOnly",
        },
    )
    assert no_digit_res.status_code == 422, f"Expected 422 for missing digit, got {no_digit_res.status_code}"
    print("All password complexity constraints verified.")

    print("\n--- 8. Test Prevention of Admin/Trainer Registration (Requirement 8) ---")
    with TestingSessionLocal() as session:
        admin_role = session.query(Role).filter(Role.name == "ADMIN").first()
        trainer_role = session.query(Role).filter(Role.name == "TRAINER").first()

    # Attempt to register with ADMIN role_id
    admin_attempt = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Fake Admin",
            "email": "fakeadmin@example.com",
            "password": "AdminPassword1",
            "confirm_password": "AdminPassword1",
            "role_id": str(admin_role.id),
        },
    )
    assert admin_attempt.status_code == 403, f"Expected 403 Forbidden for admin registration, got {admin_attempt.status_code}"

    # Attempt to register with TRAINER role_id
    trainer_attempt = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Fake Trainer",
            "email": "faketrainer@example.com",
            "password": "TrainerPassword1",
            "confirm_password": "TrainerPassword1",
            "role_id": str(trainer_role.id),
        },
    )
    assert trainer_attempt.status_code == 403, f"Expected 403 Forbidden for trainer registration, got {trainer_attempt.status_code}"
    print("Public registration attempts as ADMIN or TRAINER strictly forbidden.")

    print("\n--- 9. Existing Seeded Accounts Preserved (Requirement 10) ---")
    demo_login = client.post(
        "/api/v1/auth/login",
        json={"email": "arjun.kumar@mospi.gov.in", "password": "demo123"},
    )
    assert demo_login.status_code == 200
    assert demo_login.json()["user"]["role"] == "LEARNER"

    demo_admin = client.post(
        "/api/v1/auth/login",
        json={"email": "priya.sharma@mospi.gov.in", "password": "demo123"},
    )
    assert demo_admin.status_code == 200
    assert demo_admin.json()["user"]["role"] == "ADMIN"
    print("Existing demo accounts and dual login functionality verified.")

    print("\n=======================================================")
    print("ALL PART 9A.1 PUBLIC REGISTRATION TESTS PASSED!")
    print("=======================================================")


if __name__ == "__main__":
    test_public_user_registration()
