"""Test suite for Part 9E: AI Course Recommendations, Interested Courses, Start Learning, and Learning Path integration."""

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
from app.models.course import Course
from app.models.learning_path import LearningPath
from app.models.learning_path_item import LearningPathItem
from app.models.role import Role
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.models.user_interested_course import UserInterestedCourse
from app.models.user_profile import UserProfile
from app.models.user_skill_declaration import UserSkillDeclaration
from app.services.competency_evaluation_service import competency_evaluation_service
from app.services.recommendation_service import recommendation_service

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


class TestPart9ECourseRecommendations(unittest.TestCase):
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

    def _create_learner_with_evaluation(self, email: str, official_id: str) -> Dict[str, str]:
        """Helper to create a registered user, seed profile, accepted competencies, and run evaluation."""
        from app.core.security import create_access_token, hash_password

        role = self.db.query(Role).filter(Role.name == "LEARNER").first()
        user = User(
            email=email,
            official_id=official_id,
            full_name="Rajesh Sharma",
            password_hash=hash_password("TestPass123!"),
            designation="Statistical Officer",
            experience_years=3.5,
            role_id=role.id if role else None,
            is_active=True,
        )
        self.db.add(user)
        self.db.flush()

        profile = UserProfile(
            user_id=user.id,
            designation="Statistical Officer",
            job_role="Data Analyst & Field Survey Supervisor",
            current_work_area="Sample Survey Division (SSD)",
            professional_goal="Become Lead Statistical Programmer specializing in Python and Survey Sampling",
            experience_years=3.5,
            previous_trainings="National Accounts Basics, Excel for Statistics",
            onboarding_step=3,
        )
        self.db.add(profile)
        self.db.flush()

        # Seed accepted competencies (Python and Survey Sampling)
        py_comp = self.db.query(Competency).filter(Competency.code == "TECH_PY").first()
        sample_comp = self.db.query(Competency).filter(Competency.code == "STAT_SAMPLING").first()

        if py_comp:
            self.db.add(
                UserSkillDeclaration(
                    user_id=user.id,
                    competency_id=py_comp.id,
                    self_assessed_level=2,
                    confidence_level="MEDIUM",
                    source="SELF_DECLARED",
                )
            )
        if sample_comp:
            self.db.add(
                UserSkillDeclaration(
                    user_id=user.id,
                    competency_id=sample_comp.id,
                    self_assessed_level=2,
                    confidence_level="MEDIUM",
                    source="SELF_DECLARED",
                )
            )
        self.db.commit()


        # Run Part 9D Competency Evaluation
        competency_evaluation_service.evaluate_user_competencies(self.db, user)

        token = create_access_token(subject=str(user.id), role="LEARNER")
        return {
            "Authorization": f"Bearer {token}",
            "user_id": str(user.id),
        }


    def test_01_get_course_recommendations(self):
        """Verify GET /recommendations/me returns catalog-grounded recommendations targeting actual skill gaps."""
        auth = self._create_learner_with_evaluation("rec.user1@mospi.gov.in", "REC-001")
        response = client.get("/api/v1/recommendations/me?limit=10", headers={"Authorization": auth["Authorization"]})
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

        # Verify each recommendation matches catalog courses
        db_course_ids = {str(c.id) for c in self.db.query(Course.id).all()}

        for rec in data:
            self.assertIn("course_id", rec)
            self.assertIn(rec["course_id"], db_course_ids, "Recommended course must exist in real catalog!")
            self.assertTrue(len(rec["course_title"]) > 0)
            self.assertTrue(len(rec["provider"]) > 0)
            self.assertIn(rec["priority"], ["CRITICAL", "HIGH", "MODERATE", "LOW"])
            self.assertGreaterEqual(rec["recommendation_score"], 0)
            self.assertLessEqual(rec["recommendation_score"], 100)
            self.assertIsInstance(rec["matching_competencies"], list)
            self.assertTrue(len(rec["reason"]) > 0)
            self.assertIn("is_interested", rec)
            self.assertIn("is_in_learning_path", rec)

        # Check that top recommendation addresses high priority gap
        top_rec = data[0]
        self.assertIn(top_rec["priority"], ["CRITICAL", "HIGH"])
        self.assertGreaterEqual(top_rec["recommendation_score"], 50)

    def test_02_mark_and_remove_interested_course(self):
        """Verify POST /recommendations/interested/{course_id} and DELETE /recommendations/interested/{course_id}."""
        auth = self._create_learner_with_evaluation("rec.user2@mospi.gov.in", "REC-002")
        headers = {"Authorization": auth["Authorization"]}

        # 1. Fetch recommendations to pick a real course
        rec_res = client.get("/api/v1/recommendations/me", headers=headers)
        self.assertEqual(rec_res.status_code, 200)
        recs = rec_res.json()
        self.assertGreater(len(recs), 0)

        target_course_id = recs[0]["course_id"]
        target_course_title = recs[0]["course_title"]

        # 2. Mark as interested
        mark_res = client.post(f"/api/v1/recommendations/interested/{target_course_id}", headers=headers)
        self.assertEqual(mark_res.status_code, 201)
        mark_data = mark_res.json()
        self.assertEqual(mark_data["course_id"], target_course_id)
        self.assertEqual(mark_data["course_title"], target_course_title)

        # 3. List interested courses
        list_res = client.get("/api/v1/recommendations/interested", headers=headers)
        self.assertEqual(list_res.status_code, 200)
        interested_list = list_res.json()
        self.assertEqual(len(interested_list), 1)
        self.assertEqual(interested_list[0]["course_id"], target_course_id)

        # 4. In recommendations, is_interested should now be True
        rec_res2 = client.get("/api/v1/recommendations/me", headers=headers)
        updated_rec = next(r for r in rec_res2.json() if r["course_id"] == target_course_id)
        self.assertTrue(updated_rec["is_interested"])

        # 5. Remove from interested
        del_res = client.delete(f"/api/v1/recommendations/interested/{target_course_id}", headers=headers)
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(del_res.json()["status"], "success")

        # 6. Verify removed
        list_res2 = client.get("/api/v1/recommendations/interested", headers=headers)
        self.assertEqual(list_res2.status_code, 200)
        self.assertEqual(len(list_res2.json()), 0)

    def test_03_add_course_to_learning_path_with_anti_duplicate(self):
        """Verify POST /learning-paths/add-course/{course_id} adds course and prevents duplicates."""
        auth = self._create_learner_with_evaluation("rec.user3@mospi.gov.in", "REC-003")
        headers = {"Authorization": auth["Authorization"]}

        # Pick a course
        rec_res = client.get("/api/v1/recommendations/me", headers=headers)
        recs = rec_res.json()
        course_id = recs[0]["course_id"]

        # Add course to learning path
        add_res = client.post(f"/api/v1/learning-paths/add-course/{course_id}", headers=headers)
        self.assertEqual(add_res.status_code, 201)
        item_data = add_res.json()
        self.assertEqual(item_data["course"]["id"], course_id)
        self.assertEqual(item_data["status"], "NOT_STARTED")

        # Verify active learning path now contains this item
        path_res = client.get("/api/v1/learning-paths/me", headers=headers)
        self.assertEqual(path_res.status_code, 200)
        path_data = path_res.json()
        course_ids_in_path = [item["course"]["id"] for item in path_data["items"]]
        self.assertIn(course_id, course_ids_in_path)

        # Adding same course again MUST fail with 400 (anti-duplicate guard)
        dup_res = client.post(f"/api/v1/learning-paths/add-course/{course_id}", headers=headers)
        self.assertEqual(dup_res.status_code, 400)
        err_msg = dup_res.json().get("detail") or dup_res.json().get("error", {}).get("message", "")
        self.assertIn("already in your active learning path", err_msg)


        # Check recommendations reflects is_in_learning_path == True
        rec_res2 = client.get("/api/v1/recommendations/me", headers=headers)
        updated_rec = next(r for r in rec_res2.json() if r["course_id"] == course_id)
        self.assertTrue(updated_rec["is_in_learning_path"])

    def test_04_competency_safety_guarantee(self):
        """CRITICAL: Verify recommendations, interested, and start learning NEVER alter UserCompetency.current_level."""
        auth = self._create_learner_with_evaluation("rec.user4@mospi.gov.in", "REC-004")
        headers = {"Authorization": auth["Authorization"]}
        user_uuid = uuid.UUID(auth["user_id"])

        # Snapshot initial competency levels
        initial_comps = self.db.query(UserCompetency).filter(UserCompetency.user_id == user_uuid).all()
        initial_levels = {uc.competency_id: (uc.current_level, uc.evidence_source) for uc in initial_comps}
        self.assertGreater(len(initial_levels), 0)

        # 1. Fetch recommendations multiple times
        for _ in range(3):
            client.get("/api/v1/recommendations/me", headers=headers)

        # 2. Mark multiple courses as interested
        rec_res = client.get("/api/v1/recommendations/me", headers=headers)
        recs = rec_res.json()
        for r in recs[:2]:
            client.post(f"/api/v1/recommendations/interested/{r['course_id']}", headers=headers)

        # 3. Add a course to learning path
        client.post(f"/api/v1/learning-paths/add-course/{recs[0]['course_id']}", headers=headers)

        # 4. Remove interested course
        client.delete(f"/api/v1/recommendations/interested/{recs[1]['course_id']}", headers=headers)

        # Check competency levels AFTER all operations
        self.db.expire_all()
        after_comps = self.db.query(UserCompetency).filter(UserCompetency.user_id == user_uuid).all()
        after_levels = {uc.competency_id: (uc.current_level, uc.evidence_source) for uc in after_comps}

        self.assertEqual(len(initial_levels), len(after_levels))
        for comp_id, (orig_lvl, orig_src) in initial_levels.items():
            curr_lvl, curr_src = after_levels[comp_id]
            self.assertEqual(
                orig_lvl,
                curr_lvl,
                f"SAFETY VIOLATION: Competency level modified from {orig_lvl} to {curr_lvl} without assessment!",
            )
            self.assertEqual(orig_src, curr_src)


if __name__ == "__main__":
    unittest.main()
