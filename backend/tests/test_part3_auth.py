"""Verification test suite for COMPETIQ Backend Part 3 (Authentication & RBAC)."""

import os
import sys
import uuid
from datetime import timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import HTTPException
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.database.base import Base
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import UserRegister
from app.services.auth_service import auth_service


def test_password_security():
    print("--- 1. Testing Password Hashing & Verification ---")
    plain = "SuperSecurePassword123"
    hashed = hash_password(plain)
    assert hashed != plain, "Password hash must not equal plain password"
    assert verify_password(plain, hashed) is True, "Valid password verification failed"
    assert verify_password("WrongPassword123", hashed) is False, "Invalid password verification unexpectedly succeeded"
    print("Password hashing & verification passed.")


def test_jwt_token():
    print("\n--- 2. Testing JWT Generation & Decoding ---")
    user_id = str(uuid.uuid4())
    role = "ADMIN"
    token = create_access_token(subject=user_id, role=role)
    payload = decode_access_token(token)

    assert payload["sub"] == user_id, f"Payload subject mismatch: {payload['sub']} != {user_id}"
    assert payload["role"] == role, f"Payload role mismatch: {payload['role']} != {role}"
    assert "exp" in payload, "Token missing expiration claim"
    print("JWT token generation and decoding passed.")


def test_registration_and_authentication():
    print("\n--- 3. Testing Registration, Login & Role Authorization ---")
    # Setup isolated in-memory test database
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine)
    db = TestingSession()

    # Seed roles
    role_learner = Role(name="LEARNER", description="Learner role")
    role_trainer = Role(name="TRAINER", description="Trainer role")
    role_admin = Role(name="ADMIN", description="Admin role")
    db.add_all([role_learner, role_trainer, role_admin])

    # Seed department
    dept = Department(name="National Accounts", code="NAT_ACC", description="National Accounts Division")
    db.add(dept)
    db.commit()

    # 3.1 Register Learner
    learner_in = UserRegister(
        official_id="COMP001",
        email="learner@example.com",
        full_name="Demo Learner",
        password="Password123",
        designation="Statistical Assistant",
        experience_years=2.0,
        role_id=role_learner.id,
        department_id=dept.id,
    )
    learner = auth_service.register_user(db, learner_in)
    assert learner.id is not None
    assert learner.email == "learner@example.com"
    assert learner.role.name == "LEARNER"
    assert learner.password_hash != "Password123"
    print("Learner registration passed.")

    # 3.2 Register Admin
    admin_in = UserRegister(
        official_id="ADMIN001",
        email="admin@example.com",
        full_name="System Admin",
        password="AdminPassword123",
        designation="Chief Data Officer",
        experience_years=10.0,
        role_id=role_admin.id,
        department_id=dept.id,
    )
    admin = auth_service.register_user(db, admin_in)
    assert admin.role.name == "ADMIN"
    print("Admin registration passed.")

    # 3.3 Duplicate Email Rejection
    try:
        auth_service.register_user(db, learner_in)
        assert False, "Duplicate email registration did not raise HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 400
        print("Duplicate email properly rejected with 400 Bad Request.")

    # 3.4 Duplicate Official ID Rejection
    dup_id_in = UserRegister(
        official_id="COMP001",
        email="another@example.com",
        full_name="Another User",
        password="Password123",
        role_id=role_learner.id,
        department_id=dept.id,
    )
    try:
        auth_service.register_user(db, dup_id_in)
        assert False, "Duplicate official_id registration did not raise HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 400
        print("Duplicate official_id properly rejected with 400 Bad Request.")

    # 3.5 Invalid Role ID
    fake_role_in = UserRegister(
        official_id="COMP999",
        email="fakerole@example.com",
        full_name="Fake Role User",
        password="Password123",
        role_id=uuid.uuid4(),
        department_id=dept.id,
    )
    try:
        auth_service.register_user(db, fake_role_in)
        assert False, "Nonexistent role registration did not raise HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 404
        print("Nonexistent role properly rejected with 404 Not Found.")

    # 3.6 Successful Authentication
    auth_user = auth_service.authenticate_user(db, "learner@example.com", "Password123")
    assert auth_user.id == learner.id
    print("Valid user authentication passed.")

    # 3.7 Incorrect Password
    try:
        auth_service.authenticate_user(db, "learner@example.com", "WrongPassword")
        assert False, "Incorrect password did not raise HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 401
        print("Incorrect password properly rejected with 401 Unauthorized.")

    # 3.8 Unknown Email
    try:
        auth_service.authenticate_user(db, "unknown@example.com", "Password123")
        assert False, "Unknown email did not raise HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 401
        print("Unknown email properly rejected with 401 Unauthorized.")

    # 3.9 Inactive User
    learner.is_active = False
    db.commit()
    try:
        auth_service.authenticate_user(db, "learner@example.com", "Password123")
        assert False, "Inactive user login did not raise HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 401
        print("Inactive user properly rejected with 401 Unauthorized.")

    db.close()


if __name__ == "__main__":
    test_password_security()
    test_jwt_token()
    test_registration_and_authentication()
    print("\n==========================================")
    print("ALL PART 3 AUTHENTICATION TESTS PASSED!")
    print("==========================================")
