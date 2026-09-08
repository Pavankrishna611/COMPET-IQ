"""Automated test suite for Backend Part 8: RAG-Based AI Learning Assistant."""

import io
import json
import math
import sys
import uuid
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup path
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.security import create_access_token, hash_password
from app.database.base import Base
from app.database.init_db import seed_database_data
from app.database.session import get_db
from app.main import app
from app.models.chat_conversation import ChatConversation
from app.models.chat_message import ChatMessage
from app.models.competency import Competency
from app.models.document_chunk import DocumentChunk
from app.models.learning_material import LearningMaterial
from app.models.learning_path import LearningPath
from app.models.role import Role
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.retrieval_service import RetrievalService
from app.services.vector_store_service import VectorStoreService

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


def setup_module():
    """Create in-memory SQLite schema and seed standard reference data."""
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as session:
        seed_database_data(db_session=session)


SAMPLE_SAMPLING_GUIDE = """
Principles of Stratified Random Sampling and Estimation Standards

Chapter 1: Foundations of Stratification
In modern official statistics and survey administration, stratified random sampling divides a heterogeneous population into mutually exclusive and exhaustive subgroups called strata before sampling. 

The primary objective of stratified sampling is to minimize overall sampling variance and standard error. By partitioning the sample frame into homogeneous strata, estimators achieve substantially higher statistical precision compared to simple random sampling with the same sample size.

Chapter 2: Allocation Strategies
Three primary methods are used to allocate sample sizes across strata:
1. Proportional Allocation: The number of sampling units drawn from each stratum is directly proportional to the total stratum population size.
2. Optimum or Neyman Allocation: Allocation accounts for both stratum population size and stratum-level variance, minimizing total survey cost.
3. Equal Allocation: Equal sample sizes are drawn from each stratum, typically applied when subpopulation comparisons require uniform precision.

Chapter 3: Quality Control & Consistency Verification
Every national statistical survey must enforce rigorous verification protocols:
- Systematically flag outliers exceeding three standard deviations.
- Conduct cross-table validation checks prior to publishing final macro aggregates.
- Document imputation procedures transparently to maintain public credibility and statistical integrity.
"""


# -----------------------------------------------------------------------------
# Test 1: Chunking Service
# -----------------------------------------------------------------------------

def test_part8_chunking_service():
    """Verify semantic paragraph-aware chunking and metadata attribution."""
    print("\n--- 1. Testing Document Chunking Service ---")

    mat_id = uuid.uuid4()
    chunks = ChunkingService.chunk_document_text(
        text=SAMPLE_SAMPLING_GUIDE,
        material_id=mat_id,
        material_title="Sampling Guide",
        file_type="txt",
        topic="Sampling Methods",
        chunk_size=800,
        chunk_overlap=150,
    )

    assert len(chunks) >= 2, f"Expected at least 2 chunks, got {len(chunks)}"
    for idx, c in enumerate(chunks):
        assert c["learning_material_id"] == mat_id
        assert c["chunk_index"] == idx
        assert len(c["content"]) > 0
        assert c["token_count"] > 0
        assert c["vector_id"] == f"{mat_id}_chunk_{idx}"
        meta = json.loads(c["metadata_json"])
        assert meta["material_title"] == "Sampling Guide"
        assert meta["topic"] == "Sampling Methods"

    print(f"Chunking verified: {len(chunks)} chunks created with valid metadata.")


# -----------------------------------------------------------------------------
# Test 2: Embedding Service
# -----------------------------------------------------------------------------

def test_part8_embedding_service():
    """Verify vector generation, dimensionality, and L2 normalization."""
    print("\n--- 2. Testing Embedding Service ---")

    test_sentence = "Stratified sampling minimizes overall survey variance."
    vec = EmbeddingService.generate_embedding(test_sentence)

    assert isinstance(vec, list)
    assert len(vec) == 384, f"Expected 384-dim vector, got {len(vec)}"

    # Check L2 normalization (length close to 1.0)
    norm = math.sqrt(sum(x * x for x in vec))
    assert 0.95 <= norm <= 1.05, f"Vector should be L2 normalized, norm={norm}"

    # Batch generation
    batch = ["First sentence about statistics.", "Second sentence about surveys."]
    vecs = EmbeddingService.generate_embeddings(batch)
    assert len(vecs) == 2
    assert len(vecs[0]) == 384
    assert len(vecs[1]) == 384

    # Empty text returns zero vector
    empty_vec = EmbeddingService.generate_embedding("")
    assert len(empty_vec) == 384
    assert all(x == 0.0 for x in empty_vec)

    print("Embedding service verified: 384-dimensional normalized vectors.")


# -----------------------------------------------------------------------------
# Test 3: ChromaDB Vector Store Service
# -----------------------------------------------------------------------------

def test_part8_vector_store_service():
    """Verify ChromaDB persistence, upsert, nearest-neighbor search, and deletion."""
    print("\n--- 3. Testing ChromaDB Vector Store Service ---")

    mat_id = uuid.uuid4()
    test_chunks = [
        {
            "vector_id": f"{mat_id}_chunk_0",
            "content": "Stratified random sampling partitions the population into homogeneous strata.",
            "learning_material_id": mat_id,
            "chunk_index": 0,
            "metadata": {
                "material_id": str(mat_id),
                "material_title": "Sampling Primer",
                "chunk_index": 0,
                "file_type": "txt",
                "topic": "Sampling",
            },
        },
        {
            "vector_id": f"{mat_id}_chunk_1",
            "content": "Neyman allocation minimizes the cost and variance of stratified surveys.",
            "learning_material_id": mat_id,
            "chunk_index": 1,
            "metadata": {
                "material_id": str(mat_id),
                "material_title": "Sampling Primer",
                "chunk_index": 1,
                "file_type": "txt",
                "topic": "Sampling",
            },
        },
    ]

    embeddings = EmbeddingService.generate_embeddings([c["content"] for c in test_chunks])
    count = VectorStoreService.add_chunks(test_chunks, embeddings)
    assert count == 2

    # Query search
    query = "How do homogeneous strata reduce variance in survey design?"
    q_vec = EmbeddingService.generate_embedding(query)
    matches = VectorStoreService.search_chunks(q_vec, top_k=2)

    assert len(matches) >= 1
    top_match = matches[0]
    assert "stratified" in top_match["content"].lower() or "strata" in top_match["content"].lower()
    assert top_match["similarity"] > 0.0

    # Delete chunks for material
    del_count = VectorStoreService.delete_material_chunks(str(mat_id))
    assert del_count == 2
    print("VectorStoreService CRUD and similarity search successfully verified.")


# -----------------------------------------------------------------------------
# Test 4: End-to-End RAG Q&A, Indexing, and Chat Lifecycles
# -----------------------------------------------------------------------------

def test_part8_full_rag_assistant_pipeline():
    """Verify full lifecycle: Upload -> Approval -> Indexing -> Learner Chat -> Grounded Citations -> RBAC."""
    print("\n--- 4. Testing Full RAG Pipeline via API Endpoints ---")

    with TestingSessionLocal() as session:
        trainer_role = session.query(Role).filter(Role.name == "TRAINER").first()
        learner_role = session.query(Role).filter(Role.name == "LEARNER").first()
        comp_stat = session.query(Competency).filter(Competency.code == "STAT_SAMPLING").first()

        trainer = session.query(User).filter(User.official_id == "TR-801").first()
        if not trainer:
            trainer = User(
                official_id="TR-801",
                email="trainer801@competiq.org",
                full_name="RAG Lead Trainer",
                password_hash=hash_password("TrainerPass123!"),
                role_id=trainer_role.id,
                is_active=True,
            )
            session.add(trainer)

        learner = session.query(User).filter(User.official_id == "LR-802").first()
        if not learner:
            learner = User(
                official_id="LR-802",
                email="learner802@competiq.org",
                full_name="RAG Learner User",
                password_hash=hash_password("LearnerPass123!"),
                role_id=learner_role.id,
                is_active=True,
            )
            session.add(learner)

        session.commit()
        session.refresh(trainer)
        session.refresh(learner)

        # Set learner competency profile
        user_comp = UserCompetency(
            user_id=learner.id,
            competency_id=comp_stat.id,
            current_level=2.0,
            confidence_score=0.8,
        )
        session.add(user_comp)
        session.commit()

        trainer_id = trainer.id
        learner_id = learner.id
        comp_id = comp_stat.id

    trainer_token = create_access_token(subject=str(trainer_id), role="TRAINER")
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    learner_token = create_access_token(subject=str(learner_id), role="LEARNER")
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # 1. Trainer uploads educational document
    file_bytes = SAMPLE_SAMPLING_GUIDE.encode("utf-8")
    res = client.post(
        "/api/v1/ai-assessments/materials/upload",
        files={"file": ("stratified_sampling_guide.txt", io.BytesIO(file_bytes), "text/plain")},
        data={"title": "Official Stratified Sampling and Estimation Standards", "competency_id": str(comp_id)},
        headers=trainer_headers,
    )
    assert res.status_code == 201
    mat_id = res.json()["id"]

    # 2. Attempt to index unapproved material -> 400 Bad Request
    res = client.post(f"/api/v1/materials/{mat_id}/index", headers=trainer_headers)
    assert res.status_code == 400
    assert "must be approved" in res.json()["error"]["message"]

    # 3. Learner attempting to approve material -> 403 Forbidden
    res = client.post(f"/api/v1/materials/{mat_id}/approve", headers=learner_headers)
    assert res.status_code == 403

    # 4. Trainer approves material
    res = client.post(f"/api/v1/materials/{mat_id}/approve", headers=trainer_headers)
    assert res.status_code == 200

    # 5. Trainer indexes material into vector store
    res = client.post(f"/api/v1/materials/{mat_id}/index", headers=trainer_headers)
    assert res.status_code == 200
    index_res = res.json()
    assert index_res["status"] == "INDEXED"
    assert index_res["chunks_created"] >= 2
    assert index_res["vectors_stored"] >= 2
    print(f"Material indexed: {index_res['chunks_created']} chunks, {index_res['vectors_stored']} vectors stored.")

    # 6. Check indexing status endpoint
    res = client.get(f"/api/v1/materials/{mat_id}/index-status", headers=trainer_headers)
    assert res.status_code == 200
    status_res = res.json()
    assert status_res["is_approved"] is True
    assert status_res["is_indexed"] is True
    assert status_res["chunk_count"] >= 2

    # 7. Learner asks relevant educational question
    res = client.post(
        "/api/v1/assistant/chat",
        json={"message": "What is stratified sampling and how does it reduce variance?"},
        headers=learner_headers,
    )
    assert res.status_code == 200, f"Chat failed: {res.text}"
    chat_res = res.json()
    conv_id = chat_res["conversation_id"]

    assert chat_res["answer"] is not None
    assert len(chat_res["sources"]) >= 1
    top_source = chat_res["sources"][0]
    assert "Sampling" in top_source["material_title"]
    assert top_source["relevance_score"] >= 0.35
    assert chat_res["generation_mode"] in ["RAG_LLM", "RETRIEVAL_ONLY"]
    assert len(chat_res["suggested_followups"]) >= 1
    print(f"Learner Q&A successful. Top Source: '{top_source['material_title']}' (Score: {top_source['relevance_score']})")

    # 8. Learner asks unrelated question -> Assistant does not hallucinate
    res = client.post(
        "/api/v1/assistant/chat",
        json={
            "message": "How do I assemble an automobile engine cylinder head?",
            "conversation_id": conv_id,
        },
        headers=learner_headers,
    )
    assert res.status_code == 200
    unrelated_res = res.json()
    assert "couldn't find sufficient information" in unrelated_res["answer"].lower() or "approved learning material" in unrelated_res["answer"].lower()
    assert len(unrelated_res["sources"]) == 0
    assert unrelated_res["confidence"] == "LOW"
    print("Hallucination guard verified: Unrelated question politely declined with zero sources cited.")

    # 9. Multi-turn conversation continuation
    res = client.post(
        "/api/v1/assistant/chat",
        json={
            "message": "Explain Neyman allocation in survey design.",
            "conversation_id": conv_id,
        },
        headers=learner_headers,
    )
    assert res.status_code == 200
    continued_res = res.json()
    assert continued_res["conversation_id"] == conv_id
    assert len(continued_res["sources"]) >= 1

    # 10. List Learner conversations
    res = client.get("/api/v1/assistant/conversations", headers=learner_headers)
    assert res.status_code == 200
    convs = res.json()
    assert len(convs) >= 1
    assert any(c["id"] == conv_id for c in convs)
    # Check title generation
    active_conv = next(c for c in convs if c["id"] == conv_id)
    assert "Stratified" in active_conv["title"] or "Sampling" in active_conv["title"]
    print(f"Conversation list verified. Generated title: '{active_conv['title']}'")

    # 11. Retrieve Conversation Transcript
    res = client.get(f"/api/v1/assistant/conversations/{conv_id}", headers=learner_headers)
    assert res.status_code == 200
    conv_detail = res.json()
    assert len(conv_detail["messages"]) == 6  # 3 user questions + 3 assistant answers
    # Verify chronological ordering
    roles = [m["role"] for m in conv_detail["messages"]]
    assert roles == ["USER", "ASSISTANT", "USER", "ASSISTANT", "USER", "ASSISTANT"]

    # 12. Security Boundary: Learner B cannot access Learner A's conversation
    with TestingSessionLocal() as session:
        role_lr = session.query(Role).filter(Role.name == "LEARNER").first()
        learner_b = User(
            official_id="LR-803",
            email="learner803@competiq.org",
            full_name="Second Learner",
            password_hash=hash_password("LearnerPass123!"),
            role_id=role_lr.id,
            is_active=True,
        )
        session.add(learner_b)
        session.commit()
        learner_b_id = learner_b.id

    learner_b_token = create_access_token(subject=str(learner_b_id), role="LEARNER")
    learner_b_headers = {"Authorization": f"Bearer {learner_b_token}"}

    res = client.get(f"/api/v1/assistant/conversations/{conv_id}", headers=learner_b_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden for Learner B, got {res.status_code}"

    # 13. Learner A deletes conversation
    res = client.delete(f"/api/v1/assistant/conversations/{conv_id}", headers=learner_headers)
    assert res.status_code == 200

    # Verify conversation is gone
    res = client.get(f"/api/v1/assistant/conversations/{conv_id}", headers=learner_headers)
    assert res.status_code == 404

    print("RAG Q&A, source citation, conversation management, and RBAC boundaries verified.")


if __name__ == "__main__":
    setup_module()
    test_part8_chunking_service()
    test_part8_embedding_service()
    test_part8_vector_store_service()
    test_part8_full_rag_assistant_pipeline()
    print("\n=======================================================")
    print("ALL PART 8 RAG ASSISTANT TESTS PASSED!")
    print("=======================================================")
