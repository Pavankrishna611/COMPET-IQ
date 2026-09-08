"""Integration and Unit Test Suite for Part 9B.1: Available Competencies API for Onboarding."""

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
from app.models.competency import Competency

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


def test_available_competencies_api():
    print("\n--- 1. Initialize Test DB and Seed Data ---")
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as session:
        seed_database_data(db_session=session)
    print("Database initialized and demo reference data seeded.")

    # Count initial competencies in DB
    with TestingSessionLocal() as session:
        initial_count = session.query(Competency).count()
    assert initial_count > 0, f"Expected seeded competencies, found {initial_count}"
    print(f"Verified {initial_count} competencies present in the database.")

    print("\n--- 2. Test Unauthorized Request is Rejected (Test 3) ---")
    # No auth header
    unauth_res = client.get("/api/v1/onboarding/competencies")
    assert unauth_res.status_code == 401, f"Expected 401 Unauthorized, got {unauth_res.status_code}"
    # Invalid token
    bad_token_res = client.get(
        "/api/v1/onboarding/competencies",
        headers={"Authorization": "Bearer invalid_token_123"},
    )
    assert bad_token_res.status_code == 401, f"Expected 401 for invalid token, got {bad_token_res.status_code}"
    print("Unauthorized requests rejected with HTTP 401.")

    print("\n--- 3. Register & Login a New User for Onboarding ---")
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Competency Onboarding Learner",
            "email": "comp_learner@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"

    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "comp_learner@example.com",
            "password": "Password123!",
        },
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print("New learner registered and authenticated.")

    print("\n--- 4. Test Authenticated Request Returns Competencies (Test 1) ---")
    res = client.get("/api/v1/onboarding/competencies", headers=auth_headers)
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}: {res.text}"
    data = res.json()
    assert "domains" in data, "Response should have 'domains' key"
    assert isinstance(data["domains"], list), "'domains' must be a list"
    assert len(data["domains"]) > 0, "Expected non-empty list of domains"
    print(f"Authenticated request returned {len(data['domains'])} domain groups.")

    print("\n--- 5. Test Competencies Grouped Correctly by Domain (Test 2) ---")
    domains = [g["domain"] for g in data["domains"]]
    expected_domains = ["STATISTICAL", "TECHNICAL", "DIGITAL_GOVERNANCE", "BEHAVIOURAL"]
    for ed in expected_domains:
        assert ed in domains, f"Expected domain '{ed}' not found in response domains: {domains}"

    # Verify domain ordering follows canonical order
    domain_indices = [domains.index(ed) for ed in expected_domains if ed in domains]
    assert domain_indices == sorted(domain_indices), "Domains are not ordered consistently"

    total_comps_returned = 0
    for group in data["domains"]:
        domain_name = group["domain"]
        comps = group["competencies"]
        assert isinstance(comps, list), f"Competencies under {domain_name} must be a list"
        assert len(comps) > 0, f"Domain {domain_name} has no competencies"
        total_comps_returned += len(comps)

        # Check alphabetical sorting inside each domain
        names = [c["name"].lower() for c in comps]
        assert names == sorted(names), f"Competencies in domain {domain_name} are not sorted alphabetically"

        # Check fields of each competency item
        for comp in comps:
            assert "id" in comp, "Competency item missing 'id'"
            assert "name" in comp, "Competency item missing 'name'"
            assert "description" in comp, "Competency item missing 'description'"
            assert "domain" in comp, "Competency item missing 'domain'"
            assert comp["domain"] == domain_name, f"Competency domain mismatch: {comp['domain']} vs {domain_name}"
            # Verify no internal leakages
            assert "created_at" not in comp, "created_at should not be exposed"
            assert "updated_at" not in comp, "updated_at should not be exposed"

    assert total_comps_returned == initial_count, (
        f"Total competencies returned ({total_comps_returned}) does not match DB count ({initial_count})"
    )
    print(f"Competencies correctly grouped into domains {domains} and sorted alphabetically.")

    print("\n--- 6. Test Existing Competency APIs Remain Functional (Test 4) ---")
    list_res = client.get("/api/v1/competencies/", headers=auth_headers)
    assert list_res.status_code == 200, f"Existing GET /api/v1/competencies/ failed: {list_res.text}"
    comps_catalog = list_res.json()
    assert isinstance(comps_catalog, list) and len(comps_catalog) > 0

    first_comp_id = comps_catalog[0]["id"]
    get_res = client.get(f"/api/v1/competencies/{first_comp_id}", headers=auth_headers)
    assert get_res.status_code == 200, f"Existing GET /api/v1/competencies/{first_comp_id} failed"
    assert get_res.json()["id"] == first_comp_id
    print("Existing competency APIs (/competencies/ and /competencies/{id}) verified functional.")

    print("\n--- 7. Test No Duplicate Competency Records Created (Test 5) ---")
    # Call endpoint multiple times
    for _ in range(3):
        repeat_res = client.get("/api/v1/onboarding/competencies", headers=auth_headers)
        assert repeat_res.status_code == 200

    with TestingSessionLocal() as session:
        final_count = session.query(Competency).count()
    assert final_count == initial_count, f"Competency count changed: {initial_count} -> {final_count}"
    print(f"Competency count unchanged at {final_count}. No duplicates created.")

    print("\n--- 8. Test Safe Handling of Empty Competency DB ---")
    # Test with empty competency table
    empty_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    EmptySession = sessionmaker(autocommit=False, autoflush=False, bind=empty_engine)
    Base.metadata.create_all(bind=empty_engine)

    def override_empty_db():
        session = EmptySession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_empty_db

    # Register user in this DB so auth works
    reg_empty = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Empty DB User",
            "email": "empty_user@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    assert reg_empty.status_code == 201

    login_empty = client.post(
        "/api/v1/auth/login",
        json={
            "email": "empty_user@example.com",
            "password": "Password123!",
        },
    )
    assert login_empty.status_code == 200
    empty_token = login_empty.json()["access_token"]
    empty_auth_headers = {"Authorization": f"Bearer {empty_token}"}

    empty_res = client.get("/api/v1/onboarding/competencies", headers=empty_auth_headers)
    assert empty_res.status_code == 200
    assert empty_res.json() == {"domains": []}, f"Expected empty domains list, got: {empty_res.json()}"
    print("Empty database safely returns empty domains array.")

    # Restore original override
    app.dependency_overrides[get_db] = override_get_db
    print("\nALL PART 9B.1 TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_available_competencies_api()
