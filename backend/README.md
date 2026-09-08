# COMPETIQ Backend

Backend API, Database Foundation, Authentication, Competency Engine, Personalized Learning Paths, Assessment & Quiz System, and **AI Assessment Generator + Document Processing** for the **COMPETIQ** Intelligent Competency and Personalized Learning Platform.

## Technology Stack

- **Python** (3.11+)
- **FastAPI** — Modern, high-performance web framework
- **Uvicorn** — Lightning-fast ASGI server
- **SQLAlchemy 2.0** — Robust ORM with Declarative Models and Relationships
- **PostgreSQL** & **psycopg2-binary** — Production-ready relational database support (with SQLite in-memory testing)
- **Pydantic Settings & Pydantic v2** — Type-safe, environment-driven configuration and data validation
- **Passlib & Bcrypt** — Industry-standard salted password hashing
- **Python-Jose** — Secure JWT (JSON Web Token) generation and signature validation
- **pypdf** — PDF document text extraction
- **python-docx** — Microsoft Word document text and table extraction
- **python-pptx** — PowerPoint slide text and presentation extraction
- **python-multipart** & **httpx** — Streaming file upload handling and HTTP LLM integration

---

## Architecture Overview

```text
backend/
├── app/
│   ├── main.py                    # FastAPI application, lifespan, CORS, and modular router registration
│   ├── api/
│   │   ├── ai_assessments.py      # Part 7: Document upload, AI/Mock question generation, trainer review
│   │   ├── assessments.py         # Part 6: Assessment management, authoring, and results analytics
│   │   ├── quiz.py                # Part 6: Learner quiz attempts, answer recording, submission & scoring
│   │   ├── learning_paths.py      # Part 5: Personalized learning path generation and milestone tracking
│   │   ├── recommendations.py     # Part 5: Gap-driven course recommendation engine
│   │   ├── courses.py             # Part 5: Course catalog, competency tagging, prerequisites
│   │   ├── skill_gaps.py          # Part 4: Personalized and organizational skill gap analysis
│   │   ├── competencies.py        # Part 4: Competency catalog, profiles, role requirements
│   │   ├── auth.py                # Part 3: Registration, login, JWT issuance, profile
│   │   ├── health.py              # Health check endpoint (/api/v1/health)
│   │   └── dependencies.py        # Security & RBAC dependencies (get_current_user, require_roles)
│   ├── core/
│   │   ├── config.py              # Environment configuration & Pydantic settings
│   │   └── security.py            # Password hashing and JWT generation/decoding
│   ├── database/
│   │   ├── base.py                # Declarative Base metadata
│   │   ├── session.py             # Engine, SessionLocal, get_db generator
│   │   └── init_db.py             # Schema initialization and reference data seeding
│   ├── models/                    # 20 Registered SQLAlchemy Tables:
│   │   ├── base.py                # Abstract BaseModel with UUID PK and timestamps
│   │   ├── role.py                # System roles (ADMIN, TRAINER, LEARNER, Job Roles)
│   │   ├── department.py          # Departments and organizational divisions
│   │   ├── user.py                # User accounts with foreign keys and relationships
│   │   ├── competency.py          # Competency taxonomy
│   │   ├── user_competency.py     # User competency evaluation profiles
│   │   ├── role_competency.py     # Role target benchmarks & priorities
│   │   ├── course.py              # Learning courses and catalog
│   │   ├── course_competency.py   # Course-competency mappings with gain levels
│   │   ├── course_prerequisite.py # Course prerequisite directed graph
│   │   ├── learning_path.py       # Personalized learning paths
│   │   ├── learning_path_item.py  # Ordered steps/courses in a learning path
│   │   ├── assessment.py          # Official tests and evaluations (DRAFT, PUBLISHED, ARCHIVED)
│   │   ├── question.py            # Assessment questions with competency attribution
│   │   ├── assessment_attempt.py  # User test attempts and evaluation summary
│   │   ├── question_attempt.py    # Item-level user answers, correctness, and points
│   │   ├── learning_material.py   # Part 7: Uploaded documents and extraction metadata
│   │   ├── generated_question.py  # Part 7: AI/Mock generated questions pending trainer review
│   │   ├── document_chunk.py      # Part 8: Indexed text segments and vector IDs
│   │   ├── chat_conversation.py   # Part 8: Multi-turn chat conversations
│   │   └── chat_message.py        # Part 8: Chronological chat messages with cited sources
│   ├── schemas/                   # Pydantic validation and response schemas
│   └── services/                  # Business logic and domain engines:
│       ├── auth_service.py
│       ├── competency_service.py
│       ├── skill_gap_service.py
│       ├── course_service.py
│       ├── recommendation_service.py
│       ├── learning_path_service.py
│       ├── assessment_service.py
│       ├── quiz_service.py
│       ├── competency_update_service.py
│       ├── file_service.py
│       ├── document_service.py
│       ├── content_analysis_service.py
│       ├── question_validation_service.py
│       ├── question_generation_service.py
│       ├── chunking_service.py      # Part 8: Semantic paragraph-aware chunking
│       ├── embedding_service.py     # Part 8: SentenceTransformer vector embedding
│       ├── vector_store_service.py  # Part 8: ChromaDB persistent vector database
│       ├── retrieval_service.py     # Part 8: Nearest neighbor similarity search & deduplication
│       ├── chat_service.py          # Part 8: Conversation lifecycles & message histories
│       ├── rag_service.py           # Part 8: Context building, learner profiling & generation
│       └── document_indexing_service.py # Part 8: Approval & vector indexing pipeline
├── tests/                         # Full automated test suite (Parts 2-8)
├── uploads/learning_materials/    # Secure document upload storage
├── vector_store/                  # ChromaDB vector database storage
├── requirements.txt
├── .env.example
└── README.md
```

---

## Part 7: AI Assessment Generator + Document Processing

The AI Assessment Generator allows Trainers and Administrators to upload educational documents, extract and analyze text, synthesize high-quality assessment questions, review/edit/regenerate questions, and export approved questions into official Part 6 Assessments.

### 1. Document Processing Pipeline
- **Multi-Format Extraction**:
  - `.pdf`: Page-by-page text extraction via `pypdf.PdfReader` with decryption handling.
  - `.docx`: Paragraph and table cell extraction via `python-docx`.
  - `.pptx`: Slide title and text frame extraction via `python-pptx`.
  - `.txt`: Multi-encoding fallback text reader (`utf-8`, `utf-8-sig`, `latin-1`, `cp1252`).
- **Text Normalization**: Strips control characters, standardizes line breaks, collapses excess blank lines, and preserves headings and lists.
- **Content Profiling**: Calculates word count, character count, estimated reading duration (`words // 200 + 1`), prominent domain topics, and informative keywords.
- **Smart Chunking**: Paragraph-aware text segmentation preserving sentence boundaries.

### 2. Dual Generation Modes
- **AI Mode (`OpenAILLMProvider`)**: Activated when `LLM_API_KEY` is provided. Generates structured questions via external LLM completion.
- **Mock Fallback Mode (`MockLLMProvider`)**: Built-in deterministic generator for local development and offline environments. Operates automatically when `LLM_API_KEY` is unset. Clearly flags `generation_mode: "MOCK"`.

### 3. Psychometric Validation & Duplicate Detection
- Verifies 4 distinct, non-empty options (`A`, `B`, `C`, `D`).
- Verifies `correct_option` is valid and points to non-empty text.
- Enforces educational explanation requirement.
- Duplicate detection flags near-identical questions ($\ge 85\%$ textual similarity via `difflib.SequenceMatcher`).

### 4. Trainer Review Workflow & Assessment Hand-off
Questions are staged in `generated_questions` with status `GENERATED`:
- **Edit**: Updates question content, sets status to `EDITED`, and re-runs validation.
- **Approve**: Marks valid questions as `APPROVED`.
- **Reject**: Marks questions as `REJECTED`.
- **Regenerate**: Generates a replacement question from the underlying document text.
- **Create Assessment (`POST /create-assessment`)**: Converts selected `APPROVED` questions into an official Part 6 `Assessment` (in `DRAFT` status) and `Question` records ready for publishing.

---

## API Surface

### 1. AI Learning Assistant (`/api/v1/assistant`)
- `POST /api/v1/assistant/chat`: Query the AI Learning Assistant with an educational question. Returns grounded answer, cited sources, confidence level, and follow-up prompts.
- `GET /api/v1/assistant/conversations`: List active chat conversations for the caller.
- `GET /api/v1/assistant/conversations/{id}`: Fetch complete conversation transcript with message history and sources.
- `DELETE /api/v1/assistant/conversations/{id}`: Delete conversation (owner only).

### 2. Document Indexing Pipeline (`/api/v1/materials`)
- `POST /api/v1/materials/{id}/approve`: Mark processed learning material as approved for knowledge indexing (*Trainer/Admin*).
- `POST /api/v1/materials/{id}/index`: Chunk, embed, and store document vectors in ChromaDB and metadata in `document_chunks` (*Trainer/Admin*).
- `GET /api/v1/materials/{id}/index-status`: Inspect approval state and vector counts (*Trainer/Admin*).
- `POST /api/v1/materials/{id}/reindex`: Purge old vectors and re-index document (*Trainer/Admin*).

### 3. AI Assessment Generator (`/api/v1/ai-assessments`)
- `POST /materials/upload`: Upload file (.pdf, .docx, .pptx, .txt), extract text, and stage (*Trainer/Admin*).
- `GET /materials`: List uploaded materials with `status`, `file_type`, `search` filters (*Trainer/Admin*).
- `GET /materials/{id}`: View learning material details (*Trainer/Admin*).
- `GET /materials/{id}/analysis`: Get statistical word count, reading duration, topics, and keywords (*Trainer/Admin*).
- `POST /generate`: Synthesize questions from material (supports AI and Mock modes) (*Trainer/Admin*).
- `GET /materials/{id}/questions`: List staged questions with `generation_status` filter (*Trainer/Admin*).
- `PUT /questions/{id}`: Edit staged question (*Trainer/Admin*).
- `DELETE /questions/{id}`: Delete staged question (*Trainer/Admin*).
- `POST /questions/{id}/approve`: Approve valid question (*Trainer/Admin*).
- `POST /questions/{id}/reject`: Reject question (*Trainer/Admin*).
- `POST /questions/{id}/regenerate`: Generate replacement question (*Trainer/Admin*).
- `POST /create-assessment`: Convert approved questions into official Part 6 Assessment (*Trainer/Admin*).

### 2. Assessment Management (`/api/v1/assessments`)
- `POST /assessments`: Create draft assessment (*Trainer/Admin*).
- `GET /assessments`: List published assessments for learners or all for trainers.
- `GET /assessments/{id}`: View assessment details.
- `PUT /assessments/{id}`: Update assessment (*Trainer/Admin*).
- `DELETE /assessments/{id}`: Delete assessment (*Trainer/Admin*).
- `POST /assessments/{id}/publish`: Publish assessment to learner catalog (*Trainer/Admin*).
- `POST /assessments/{id}/questions`: Add question to assessment (*Trainer/Admin*).
- `GET /assessments/{id}/results`: View aggregate attempt analytics (*Trainer/Admin*).

### 3. Quiz Engine (`/api/v1/quiz`)
- `POST /quiz/{assessment_id}/start`: Start or resume a quiz attempt.
- `GET /quiz/attempts/{attempt_id}`: Get active attempt state with learner-safe questions.
- `POST /quiz/attempts/{attempt_id}/answer`: Save an individual answer.
- `POST /quiz/attempts/{attempt_id}/submit`: Submit attempt, calculate score, and update competencies.
- `GET /quiz/my-attempts`: View personal quiz attempt history.

### 4. Learning Paths & Recommendations (`/api/v1/learning-paths`, `/api/v1/recommendations`)
- `GET /api/v1/recommendations/me`: Get recommended courses based on active skill gaps.
- `POST /api/v1/learning-paths/generate`: Generate a personalized sequential learning path.
- `GET /api/v1/learning-paths/me`: View active learning path with milestones and progress.
- `PUT /api/v1/learning-paths/items/{item_id}/progress`: Update module progress (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`).

### 5. Competencies & Skill Gaps (`/api/v1/competencies`, `/api/v1/skill-gaps`)
- `GET /api/v1/competencies`: Search competencies catalog.
- `GET /api/v1/competencies/me`: View authenticated user's competency profile.
- `GET /api/v1/skill-gaps/me`: Personalized skill gap analysis against role benchmark.
- `GET /api/v1/skill-gaps/organization/summary`: Workforce skill gap intelligence (*Admin Only*).

### 6. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Register new user.
- `POST /api/v1/auth/login`: Authenticate and receive JWT Bearer token.
- `GET /api/v1/auth/me`: Get authenticated user profile.

---

## Installation & Running

1. **Activate virtual environment:**
   ```bash
   venv\Scripts\activate      # Windows
   source venv/bin/activate   # Linux/macOS
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   Copy `.env.example` to `.env` and configure:
   ```env
   UPLOAD_DIR=uploads/learning_materials
   MAX_UPLOAD_SIZE_MB=25
   ALLOWED_DOCUMENT_TYPES=pdf,docx,pptx,txt
   LLM_PROVIDER=mock
   LLM_MODEL=gpt-4o-mini
   # LLM_API_KEY=sk-... (Leave empty to use Mock mode)
   ```

4. **Run development server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## Automated Test Verification

Run individual test suites:
```bash
python tests/test_part2_db.py             # Database models, relationships, and seed checks
python tests/test_part3_auth.py           # JWT, password hashing, and RBAC
python tests/test_part4_skill_gap.py      # Competencies and skill gap calculation
python tests/test_part5_learning_path.py  # Recommendations and sequential learning paths
python tests/test_part6_assessment.py     # Assessment authoring, quiz attempts, and scoring
python tests/test_part7_ai_assessment.py  # AI Assessment Generator, document processing, review workflow
python tests/test_part8_rag_assistant.py  # RAG AI Learning Assistant, ChromaDB retrieval, grounded chat
```
