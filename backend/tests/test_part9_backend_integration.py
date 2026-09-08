"""Backend Integration Test Suite for Part 9: Analytics, Demo Seeding, and Full API Flows."""

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


def test_part9_backend_integration():
    """Verify demo user seeding, dual credential login, learner APIs, and admin analytics."""
    print("\n--- 1. Testing Database Initialization and Demo Seeding ---")
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as session:
        seed_database_data(db_session=session)
    print("In-memory SQLite database initialized and demo accounts seeded.")

    print("\n--- 2. Testing Dual Identifier Authentication ---")
    # Test 2a: Login with email
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "arjun.kumar@mospi.gov.in", "password": "demo123"},
    )
    assert res.status_code == 200, f"Email login failed: {res.text}"
    learner_data = res.json()
    learner_token = learner_data["access_token"]
    assert learner_data["user"]["role"] == "LEARNER"
    print("Learner login with email succeeded.")

    # Test 2b: Login with official_id
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "SSS-2021-0892", "password": "demo123"},
    )
    assert res.status_code == 200, f"Official ID login failed: {res.text}"
    print("Learner login with official ID succeeded.")

    # Test 2c: Login as Admin
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "priya.sharma@mospi.gov.in", "password": "demo123"},
    )
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_data = res.json()
    admin_token = admin_data["access_token"]
    assert admin_data["user"]["role"] == "ADMIN"
    print("Admin login succeeded.")

    # Test 2d: Login as Trainer
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "rahul.verma@nssta.gov.in", "password": "demo123"},
    )
    assert res.status_code == 200, f"Trainer login failed: {res.text}"
    trainer_data = res.json()
    assert trainer_data["user"]["role"] == "TRAINER"
    print("Trainer login succeeded.")

    learner_headers = {"Authorization": f"Bearer {learner_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    print("\n--- 3. Testing Learner Domain APIs with Real Seeded Data ---")
    # 3a. Current user profile
    res = client.get("/api/v1/auth/me", headers=learner_headers)
    assert res.status_code == 200
    user_prof = res.json()
    assert user_prof["full_name"] == "Arjun Kumar"
    print(f"Profile verified: {user_prof['full_name']} ({user_prof['official_id']})")

    # 3b. Competencies
    res = client.get("/api/v1/competencies/me", headers=learner_headers)
    assert res.status_code == 200
    comps = res.json()
    assert len(comps) >= 5, f"Expected >= 5 competencies, got {len(comps)}"
    print(f"Learner competencies loaded: {len(comps)} records found.")

    # 3c. Skill Gaps
    res = client.get("/api/v1/skill-gaps/me", headers=learner_headers)
    assert res.status_code == 200
    gap_report = res.json()
    assert "summary" in gap_report
    assert len(gap_report["skill_gaps"]) >= 1
    print(f"Skill gap analysis loaded: {gap_report['summary']['critical_gaps']} critical gaps detected.")

    # 3d. Recommendations
    res = client.get("/api/v1/recommendations/me", headers=learner_headers)
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) >= 1
    print(f"Course recommendations loaded: {len(recs)} courses recommended.")

    # 3e. Learning Path Generation & Active Path Retrieval
    res = client.post("/api/v1/learning-paths/generate", headers=learner_headers)
    assert res.status_code in [200, 201]
    gen_lp = res.json()
    assert len(gen_lp["learning_path"]["items"]) >= 1

    res = client.get("/api/v1/learning-paths/me", headers=learner_headers)
    assert res.status_code == 200
    active_lp = res.json()
    assert len(active_lp["items"]) >= 1
    print(f"Personalized learning path active: {len(active_lp['items'])} items.")

    print("\n--- 4. Testing Admin Analytics Endpoints & RBAC Protection ---")
    # 4a. Dashboard Analytics
    res = client.get("/api/v1/analytics/dashboard", headers=admin_headers)
    assert res.status_code == 200
    dash = res.json()
    assert dash["total_officers"] >= 3
    assert len(dash["department_health"]) >= 1
    assert len(dash["top_skill_gaps"]) >= 1
    assert len(dash["insights"]) >= 1
    print(f"Admin Dashboard Analytics verified: Total Officers = {dash['total_officers']}.")

    # 4b. Workforce Analytics
    res = client.get("/api/v1/analytics/workforce", headers=admin_headers)
    assert res.status_code == 200
    wf = res.json()
    assert wf["total_officers"] >= 3
    print(f"Workforce Analytics verified: Coverage = {wf['assessment_coverage_pct']}%.")

    # 4c. Skill Gap Analytics
    res = client.get("/api/v1/analytics/skill-gaps", headers=admin_headers)
    assert res.status_code == 200
    sg = res.json()
    assert sg["total_gaps_identified"] >= 1
    print(f"Organization Skill Gaps verified: Total Gaps = {sg['total_gaps_identified']}.")

    # 4d. Training Analytics
    res = client.get("/api/v1/analytics/training", headers=admin_headers)
    assert res.status_code == 200
    tr = res.json()
    assert tr["average_score_pct"] > 0
    print(f"Training Analytics verified: Avg Score = {tr['average_score_pct']}%.")

    # 4e. AI Insights
    res = client.get("/api/v1/analytics/insights", headers=admin_headers)
    assert res.status_code == 200
    ins = res.json()
    assert len(ins["insights"]) >= 1
    print(f"Data-driven Insights verified: {len(ins['insights'])} insights returned.")

    # 4f. RBAC Boundary: Learner must receive 403 on admin analytics
    res = client.get("/api/v1/analytics/dashboard", headers=learner_headers)
    assert res.status_code == 403
    print("RBAC Boundary verified: Learner forbidden from admin analytics.")

    print("\n=======================================================")
    print("ALL PART 9 BACKEND INTEGRATION TESTS PASSED!")
    print("=======================================================")


if __name__ == "__main__":
    test_part9_backend_integration()
