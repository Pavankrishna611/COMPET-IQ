"""Test suite for Part 10F: Trainer Material Upload.

Verifies:
1. Trainer can upload material (PDF, TXT) and text is extracted with status PROCESSED.
2. Unauthenticated user cannot upload (401 Unauthorized).
3. Learner receives 403 Forbidden when accessing trainer material endpoints.
4. Trainer can list their own materials.
5. Trainer 2 cannot access or delete Trainer 1's materials (403 Forbidden).
6. Invalid file type (.exe, .jpg) is rejected with 415.
7. Oversized file is rejected with 413.
8. Material processing/extraction status works (PROCESSED, word count, extracted text).
9. Trainer and learner materials remain strictly separated.
10. Trainer can delete their own uploaded material.
"""

import io
import os
import sys
import unittest
import uuid

# Add parent directory to sys.path for test resolution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user, get_db
from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.database.base import Base
from app.database.init_db import seed_database_data
from app.main import app
from app.models.learning_material import LearningMaterial
from app.models.role import Role
from app.models.user import User

from pypdf import PageObject, PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject


def create_minimal_pdf_bytes(text_content: str = "Official MoSPI Assessment Curriculum and Statistical Blueprint") -> bytes:
    """Create valid PDF binary with extractable text."""
    writer = PdfWriter()
    page = PageObject.create_blank_page(width=612, height=792)

    font = DictionaryObject()
    font[NameObject("/Type")] = NameObject("/Font")
    font[NameObject("/Subtype")] = NameObject("/Type1")
    font[NameObject("/BaseFont")] = NameObject("/Helvetica")

    fonts = DictionaryObject()
    fonts[NameObject("/F1")] = font

    resources = DictionaryObject()
    resources[NameObject("/Font")] = fonts
    page[NameObject("/Resources")] = resources

    content_stream = f"BT /F1 12 Tf 72 712 Td ({text_content}) Tj ET".encode("latin-1")
    stream_obj = DecodedStreamObject()
    stream_obj.set_data(content_stream)
    page[NameObject("/Contents")] = stream_obj

    writer.add_page(page)

    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


class TestPart10FTrainerUpload(unittest.TestCase):
    """Test suite for Part 10F Trainer Material Upload and Isolation."""

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

        with cls.TestingSessionLocal() as session:
            seed_database_data(session)

            # Ensure roles exist
            trainer_role = session.query(Role).filter(Role.name == "TRAINER").first()
            if not trainer_role:
                trainer_role = Role(name="TRAINER", description="Faculty Trainer")
                session.add(trainer_role)

            learner_role = session.query(Role).filter(Role.name == "LEARNER").first()
            if not learner_role:
                learner_role = Role(name="LEARNER", description="Learner Officer")
                session.add(learner_role)
            session.commit()

            # Create Trainer 1
            trainer1 = User(
                email="faculty.sharma@mospi.gov.in",
                official_id="FACULTY-001",
                full_name="Prof. Rajesh Sharma",
                password_hash=hash_password("trainer123"),
                role_id=trainer_role.id,
                is_active=True,
            )
            # Create Trainer 2
            trainer2 = User(
                email="faculty.gupta@mospi.gov.in",
                official_id="FACULTY-002",
                full_name="Dr. Anita Gupta",
                password_hash=hash_password("trainer123"),
                role_id=trainer_role.id,
                is_active=True,
            )
            # Create Learner
            learner = User(
                email="learner.kumar@mospi.gov.in",
                official_id="LEARNER-10F-001",
                full_name="Rohan Kumar",
                password_hash=hash_password("learner123"),
                role_id=learner_role.id,
                is_active=True,
            )
            session.add_all([trainer1, trainer2, learner])
            session.commit()
            session.refresh(trainer1)
            session.refresh(trainer2)
            session.refresh(learner)

            cls.trainer1_id = trainer1.id
            cls.trainer2_id = trainer2.id
            cls.learner_id = learner.id

            cls.trainer1_token = create_access_token(subject=str(trainer1.id), role="TRAINER")
            cls.trainer2_token = create_access_token(subject=str(trainer2.id), role="TRAINER")
            cls.learner_token = create_access_token(subject=str(learner.id), role="LEARNER")

        def override_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)
        app.dependency_overrides.clear()

    def test_01_trainer_upload_valid_pdf(self):
        """1. Trainer can upload official assessment material; text is extracted and status is PROCESSED."""
        pdf_bytes = create_minimal_pdf_bytes("National Accounts Statistics Blueprints and Measurement Protocols 2026")
        files = {
            "file": ("nas_curriculum.pdf", io.BytesIO(pdf_bytes), "application/pdf")
        }
        data = {
            "title": "National Accounts Statistics Curriculum"
        }
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}

        res = self.client.post("/api/v1/ai-assessments/trainer/materials/upload", files=files, data=data, headers=headers)
        self.assertEqual(res.status_code, 201, f"Upload failed: {res.text}")

        body = res.json()
        self.assertEqual(body["title"], "National Accounts Statistics Curriculum")
        self.assertEqual(body["file_type"], "pdf")
        self.assertEqual(body["status"], "PROCESSED")
        self.assertEqual(body["material_type"], "TRAINER_OFFICIAL")
        self.assertTrue(body["has_extracted_text"])
        self.assertGreater(body["word_count"], 0)
        self.assertIn("id", body)

        TestPart10FTrainerUpload.trainer1_material_id = body["id"]

        # Verify in DB
        with self.TestingSessionLocal() as session:
            mat = session.query(LearningMaterial).filter(LearningMaterial.id == uuid.UUID(body["id"])).first()
            self.assertIsNotNone(mat)
            self.assertEqual(mat.uploaded_by, self.trainer1_id)
            self.assertEqual(mat.material_type, "TRAINER_OFFICIAL")
            self.assertIn("National Accounts", mat.extracted_text)

    def test_02_unauthenticated_cannot_upload(self):
        """2. Unauthenticated request to upload trainer material is rejected with 401."""
        pdf_bytes = create_minimal_pdf_bytes("Some content")
        files = {
            "file": ("test.pdf", io.BytesIO(pdf_bytes), "application/pdf")
        }
        res = self.client.post("/api/v1/ai-assessments/trainer/materials/upload", files=files)
        self.assertEqual(res.status_code, 401)

    def test_03_learner_receives_403_on_trainer_endpoints(self):
        """3. Learner receives 403 Forbidden when calling trainer material APIs."""
        headers = {"Authorization": f"Bearer {self.learner_token}"}
        mat_id = getattr(self, "trainer1_material_id", str(uuid.uuid4()))

        # Upload attempt
        pdf_bytes = create_minimal_pdf_bytes("Learner trying to upload official material")
        files = {"file": ("sneaky.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        res_upload = self.client.post("/api/v1/ai-assessments/trainer/materials/upload", files=files, headers=headers)
        self.assertEqual(res_upload.status_code, 403)

        # List attempt
        res_list = self.client.get("/api/v1/ai-assessments/trainer/materials", headers=headers)
        self.assertEqual(res_list.status_code, 403)

        # Get details attempt
        res_get = self.client.get(f"/api/v1/ai-assessments/trainer/materials/{mat_id}", headers=headers)
        self.assertEqual(res_get.status_code, 403)

        # Delete attempt
        res_del = self.client.delete(f"/api/v1/ai-assessments/trainer/materials/{mat_id}", headers=headers)
        self.assertEqual(res_del.status_code, 403)

    def test_04_trainer_can_list_own_materials(self):
        """4. Trainer can list own materials and sees only TRAINER_OFFICIAL materials."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        res = self.client.get("/api/v1/ai-assessments/trainer/materials", headers=headers)
        self.assertEqual(res.status_code, 200)

        materials = res.json()
        self.assertGreaterEqual(len(materials), 1)
        material_ids = [m["id"] for m in materials]
        self.assertIn(self.trainer1_material_id, material_ids)
        for m in materials:
            self.assertEqual(m["material_type"], "TRAINER_OFFICIAL")

    def test_05_trainer_cannot_access_another_trainer_material(self):
        """5. Trainer 2 cannot view or delete Trainer 1's official material (403 Forbidden)."""
        headers2 = {"Authorization": f"Bearer {self.trainer2_token}"}
        mat_id = self.trainer1_material_id

        # GET detail attempt
        res_get = self.client.get(f"/api/v1/ai-assessments/trainer/materials/{mat_id}", headers=headers2)
        self.assertEqual(res_get.status_code, 403)
        self.assertIn("permission", res_get.text.lower())

        # DELETE attempt
        res_del = self.client.delete(f"/api/v1/ai-assessments/trainer/materials/{mat_id}", headers=headers2)
        self.assertEqual(res_del.status_code, 403)
        self.assertIn("permission", res_del.text.lower())

        # Trainer 2 listing should NOT show Trainer 1's material
        res_list = self.client.get("/api/v1/ai-assessments/trainer/materials", headers=headers2)
        self.assertEqual(res_list.status_code, 200)
        t2_ids = [m["id"] for m in res_list.json()]
        self.assertNotIn(mat_id, t2_ids)

    def test_06_invalid_file_type_rejected(self):
        """6. Invalid file extensions (.exe, .jpg) are rejected with 415."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        files = {
            "file": ("malicious.exe", io.BytesIO(b"binary data"), "application/octet-stream")
        }
        res = self.client.post("/api/v1/ai-assessments/trainer/materials/upload", files=files, headers=headers)
        self.assertEqual(res.status_code, 415)
        self.assertIn("Unsupported file type", res.text)

    def test_07_oversized_file_rejected(self):
        """7. Oversized file exceeding limit (20MB) is rejected with 413."""
        headers = {"Authorization": f"Bearer {self.trainer1_token}"}
        # Simulate oversized by mocking or passing a large buffer > 20MB
        # 21MB of zeroes
        big_bytes = b"0" * (21 * 1024 * 1024)
        files = {
            "file": ("huge_dataset.pdf", io.BytesIO(big_bytes), "application/pdf")
        }
        res = self.client.post("/api/v1/ai-assessments/trainer/materials/upload", files=files, headers=headers)
        self.assertEqual(res.status_code, 413)

    def test_08_trainer_upload_txt_file(self):
        """8. Trainer can upload TXT material and text is extracted with status PROCESSED."""
        headers = {"Authorization": f"Bearer {self.trainer2_token}"}
        txt_content = "Index Numbers of Industrial Production: Construction methodology, base year revisions, and data sources."
        files = {
            "file": ("iip_methodology.txt", io.BytesIO(txt_content.encode("utf-8")), "text/plain")
        }
        data = {"title": "IIP Methodology Reference"}
        res = self.client.post("/api/v1/ai-assessments/trainer/materials/upload", files=files, data=data, headers=headers)
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertEqual(body["file_type"], "txt")
        self.assertEqual(body["status"], "PROCESSED")
        self.assertTrue(body["has_extracted_text"])
        self.assertGreater(body["word_count"], 5)
        TestPart10FTrainerUpload.trainer2_material_id = body["id"]

    def test_09_trainer_and_learner_materials_strictly_separated(self):
        """9. Trainer and learner materials remain separated."""
        # Have learner upload a learner practice material
        headers_learner = {"Authorization": f"Bearer {self.learner_token}"}
        pdf_bytes = create_minimal_pdf_bytes("Learner personal practice notes on linear regression")
        files = {"file": ("learner_practice.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        data = {"title": "Learner Personal Notes"}
        res_upload = self.client.post("/api/v1/ai-assessments/materials/upload", files=files, data=data, headers=headers_learner)
        self.assertEqual(res_upload.status_code, 201)
        learner_mat_id = res_upload.json()["id"]

        # 1. Learner listing general materials should ONLY see learner practice materials, NOT trainer materials
        res_learner_list = self.client.get("/api/v1/ai-assessments/materials", headers=headers_learner)
        self.assertEqual(res_learner_list.status_code, 200)
        learner_items = res_learner_list.json()
        learner_mat_ids = [m["id"] for m in learner_items]
        self.assertIn(learner_mat_id, learner_mat_ids)
        self.assertNotIn(self.trainer1_material_id, learner_mat_ids)

        # 2. Learner directly trying to access trainer material via general endpoint gets 403
        res_learner_direct = self.client.get(f"/api/v1/ai-assessments/materials/{self.trainer1_material_id}", headers=headers_learner)
        self.assertEqual(res_learner_direct.status_code, 403)

        # 3. Trainer listing trainer materials should ONLY see trainer materials, NOT learner materials
        headers_trainer = {"Authorization": f"Bearer {self.trainer1_token}"}
        res_trainer_list = self.client.get("/api/v1/ai-assessments/trainer/materials", headers=headers_trainer)
        self.assertEqual(res_trainer_list.status_code, 200)
        trainer_mat_ids = [m["id"] for m in res_trainer_list.json()]
        self.assertNotIn(learner_mat_id, trainer_mat_ids)

    def test_10_trainer_can_delete_own_material(self):
        """10. Trainer can delete their own uploaded official material."""
        headers = {"Authorization": f"Bearer {self.trainer2_token}"}
        mat_id = self.trainer2_material_id

        res_del = self.client.delete(f"/api/v1/ai-assessments/trainer/materials/{mat_id}", headers=headers)
        self.assertEqual(res_del.status_code, 200)
        self.assertIn("successfully deleted", res_del.json().get("message", ""))

        # Verify it no longer exists
        res_get = self.client.get(f"/api/v1/ai-assessments/trainer/materials/{mat_id}", headers=headers)
        self.assertEqual(res_get.status_code, 404)


if __name__ == "__main__":
    unittest.main()
