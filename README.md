# COMPETIQ Platform

COMPETIQ is an AI-enabled skill intelligence and personalized learning platform built for civil servants and statistical professionals (MoSPI / NSSTA). It features competency taxonomy mapping, skill gap analysis, gap-driven personalized learning paths, interactive quizzes, AI-powered question generation, and RAG document assistance.

---

## System Architecture

```text
COMPETIQ Platform
├── Frontend (Next.js 14 App Router, React 18, TailwindCSS, Lucide Icons) -> http://localhost:3000
└── Backend (FastAPI, SQLAlchemy 2.0, Pydantic v2, ChromaDB Vector Store) -> http://localhost:8000
    └── Database: SQLite (local dev: competiq.db) / PostgreSQL (production)
```

---

## Quickstart (Local Development)

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **Python**: v3.11+
- **Git**

### 2. Backend Startup

1. Open a terminal in the project directory:
   ```bash
   cd backend
   ```
2. Activate the Python virtual environment:
   - **Windows (PowerShell/CMD)**:
     ```bash
     venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```
3. Start the FastAPI backend server with Uvicorn:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
4. Verify backend health:
   - Root Health Check: `http://localhost:8000/health`
   - API v1 Health Check: `http://localhost:8000/api/v1/health`
   - Interactive API Docs (Swagger UI): `http://localhost:8000/docs`

### 3. Frontend Startup

1. Open a second terminal at the root directory:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to:
   - `http://localhost:3000`

---

## Environment Configuration

### Frontend Configuration (`.env.local`)
Create `.env.local` in the project root:
```env
# Backend API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```
*Note: `NEXT_PUBLIC_API_URL` is also supported as an alias.*

### Backend Configuration (`backend/.env`)
Create `backend/.env` with the following variables:
```env
APP_NAME=COMPETIQ API
APP_VERSION=0.1.0
ENVIRONMENT=development
DEBUG=true

# Allowed CORS Origins (comma-separated list)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Database Configuration
DATABASE_URL=sqlite:///./competiq.db

# JWT Security
SECRET_KEY=replace_with_secure_random_secret_key_minimum_32_characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120

# Document & Material Uploads
UPLOAD_DIR=uploads/learning_materials
MAX_UPLOAD_SIZE_MB=20
ALLOWED_DOCUMENT_TYPES=pdf,docx,pptx,txt

# AI Assessment & RAG Assistant (Optional LLM Integration)
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL=gpt-4o-mini
```

---

## Production Deployment Checklist

When deploying COMPETIQ to production:

1. **Frontend Deployment (e.g., Vercel / Node Server / Docker)**:
   - Set `NEXT_PUBLIC_API_BASE_URL` to your production backend API domain (e.g., `https://api.competiq.gov.in`).
   - Run production build: `npm run build`
   - Start production server: `npm run start`

2. **Backend Deployment (e.g., Docker / Kubernetes / Cloud VM)**:
   - Set `ENVIRONMENT=production` and `DEBUG=false`.
   - Set `DATABASE_URL` to your managed PostgreSQL instance: `postgresql://user:password@db-host:5432/competiq`.
   - Set `CORS_ORIGINS` to your production frontend URL (e.g., `https://competiq.gov.in`).
   - Set a cryptographically secure `SECRET_KEY` (minimum 32 random characters).
   - Configure health checks to ping `GET /health`.

---

## Seeded Demo Accounts (Local Dev)

| Role | Email | Password | Role Purpose |
|---|---|---|---|
| **Learner** | `arjun.kumar@mospi.gov.in` | `demo123` | Competency profile, personalized paths, quizzes |
| **Trainer** | `rahul.verma@nssta.gov.in` | `demo123` | Assessment authoring, AI question generation, materials |
| **Administrator** | `priya.sharma@mospi.gov.in` | `demo123` | Workforce analytics, skill gap matrix, governance |
