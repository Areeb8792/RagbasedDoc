# Morpheus — Intelligent Campus Knowledge & Document Management Platform
### Production-Grade Full-Stack Institutional Knowledge Platform & Evidence-First RAG Assistant

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Django 6.0](https://img.shields.io/badge/Django-6.0-green.svg)](https://www.djangoproject.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Project Overview & Philosophy

**Morpheus** is an enterprise-grade academic knowledge and document intelligence platform. It bridges the gap between institutional policies (handbooks, examination codes, academic regulations, syllabi, fee structures) and students/faculty by delivering truthful, verified, and contextual answers through an **Evidence-First Retrieval-Augmented Generation (RAG)** architecture.

Instead of generic chatbot hallucination, Morpheus enforces strict institutional grounding:
1. **Trust & Grounding:** Answers are synthesized strictly from retrieved official documents. When evidence is insufficient, Morpheus explicitly states the absence of information rather than speculating.
2. **Transparent Citations:** Every factual claim provides clickable source citations detailing the source document, folder, page number, and matched excerpt.
3. **Folder-Based Organization:** Documents are structured into custom institutional folders (e.g., *Campus Regulations*, *Academic Curriculum*, *Department Notices*) enabling users to target queries at specific folders or across all documents.
4. **Adaptive Restyling:** Verified answers can be restyled on-the-fly into *Simple Language*, *Step-by-Step Instructions*, or *Bullet Points* without altering underlying factual claims.
5. **Continuous Gap Detection:** Unanswerable questions are automatically captured in an administrative *Knowledge Gap Monitor* to notify administrators of missing policy documentation.

---

## 2. Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8 | Fast, reactive Single Page Application (SPA) |
| **Styling & Theme** | Tailwind CSS v4 + Glassmorphism | Dark glassmorphic aesthetic with backdrop blur |
| **Routing & State** | React Router v7, React Context | Role-based routing, authentication, and state management |
| **Charts & Metrics** | Recharts | Administrative analytics, query volume, and accuracy metrics |
| **Icons & UI Extras** | Lucide React, React Hot Toast | Academic icons, accessible modal dialogs, real-time notifications |
| **Backend Framework** | Python 3.12 + Django 6.0 | Business logic, document ingestion, and chat processing |
| **API Architecture** | Django REST Framework 3.15+ | Versioned RESTful API endpoints (`/api/v1/`) |
| **Authentication** | Django REST SimpleJWT (HS256) | Stateless JWT access/refresh token rotation and RBAC |
| **API Documentation** | drf-spectacular (OpenAPI 3.0) | Interactive Swagger UI and ReDoc documentation |
| **Relational & Vector DB**| PostgreSQL 16 + pgvector | Relational schema with 384-dimensional cosine vector indexing |
| **Offline DB Fallback** | SQLite + NumPy | Automatic local vector fallback for offline development |
| **Embedding Model** | `sentence-transformers/all-MiniLM-L6-v2` | Fast 384-dimensional local dense semantic embeddings |
| **LLM Generation** | Google Gemini API (`google-genai` SDK) | Grounded natural language response generation and restyling |
| **Document Processing** | PyMuPDF (fitz), python-docx, python-pptx | Text and layout extraction from PDF, DOCX, PPTX, and TXT |
| **Email Testing Service**| Testmail.app JSON API | Automated email testing client for transactional message inspection |
| **Containerization** | Docker & Docker Compose | Multi-service orchestration (Postgres, Backend, Nginx Frontend) |

---

## 3. System Architecture

```text
                      STUDENT / FACULTY / ADMIN
                                 │
                                 ▼
                     React 19 + Vite + Tailwind CSS
                         (Glassmorphic Client)
                                 │
                                 │ Axios (JWT Bearer Auth)
                                 ▼
                     Django REST Framework 6.0
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
    accounts / audit         documents                 chat
         │                       │                       │
         │             ┌─────────┴─────────┐             │
         │             ▼                   ▼             │
         │        Folder Manager    Doc Ingestion        │
         │        (Scoped RAG)     (PDF/DOCX/PPTX)       │
         │                                 │             │
         │                         Recursive Chunker     │
         │                                 │             │
         │                        SentenceTransformer    │
         │                         (all-MiniLM-L6-v2)    │
         │                                 │             │
         │                                 ▼             │
         │                       pgvector / SQLite       │
         │                                 │             │
         └───────────────────────┬─────────┘             │
                                 ▼                       ▼
                          RAG Pipeline ◄─────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
        Vector Similarity               Google Gemini API
        (Filtered by Folder)           (Grounded Generation)
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                          Grounded Response
                       + Verified Citations
```

---

## 4. Main Features

- **Evidence-First AI Chat:** Retrieves semantic chunks above a similarity threshold, prompts Gemini with strict grounding rules, and abstains when no evidence is found.
- **Folder-Based Knowledge Management:** Group documents into folders (*Academic Regulations*, *Syllabus*, *Hostel Guidelines*) and scope chat queries to specific folders or across the entire repository.
- **Citation Explorer:** Every answer includes interactive citations linking to the exact document, version, folder, page, and chunk text.
- **Answer Restyling (Simplify):** Transform answers into *Simple Language*, *Step-by-Step Actions*, or *Bullet Points* via Gemini prompt transformation.
- **Multi-Format Ingestion:** Native extraction for PDF (PyMuPDF), DOCX (python-docx), PPTX (python-pptx), and TXT/Markdown.
- **Knowledge Gap Detection:** Automatically logs queries that returned low-confidence or no-evidence answers so administrators can address missing documentation.
- **Audit Trails & Security:** Comprehensive audit logs for document uploads, deletions, permission adjustments, and user authentications.
- **Email Testing Framework:** Integrated Testmail.app client for automated testing and inspection of outbound email workflows.
- **Glassmorphic UI Design System:** Modern, dark-mode visual interface with subtle transparency, background blurs, and responsive layouts.

---

## 5. Document Upload, Extraction & RAG Pipeline

```text
1. File Upload (.pdf, .docx, .pptx, .txt)
   └── Validated for MIME type, file extension, and MAX_UPLOAD_SIZE (25MB)
2. Document Extraction Service
   ├── PDF: PyMuPDF extracts text, preserves page numbers and layout metadata
   ├── DOCX: python-docx extracts paragraphs and structural headings
   ├── PPTX: python-pptx extracts slide numbers, titles, and text boxes
   └── TXT: UTF-8 stream decoding with encoding fallback
3. Recursive Chunking Engine
   └── Dynamic window chunking (500–1000 tokens) with configurable overlap
4. Dense Embedding Generation
   └── SentenceTransformers (all-MiniLM-L6-v2) generates 384-dimensional vectors
5. Vector Persistence
   ├── Production: PostgreSQL pgvector table with HNSW / IVFFlat index
   └── Local fallback: SQLite with NumPy cosine similarity computation
6. Grounded Query Retrieval
   ├── Filters chunks by user-selected Scope (All Documents, Single Folder, or Specific File)
   ├── Cosine similarity ranking against query embedding
   ├── Gating threshold check (RAG_SIMILARITY_THRESHOLD = 0.25)
   └── Context construction and prompt injection into Google Gemini
```

---

## 6. Directory Structure

```text
d:\djangoProject\
├── backend/                        # Django REST Framework application
│   ├── accounts/                   # User authentication, roles, profile management
│   ├── analytics/                  # KPI dashboard, query trends, accuracy metrics
│   ├── audit/                      # Immutable audit logging service
│   ├── chat/                       # Conversations, messages, citations, restyling
│   ├── config/                     # Core Django settings, URLs, exceptions, WSGI
│   ├── documents/                  # Documents, Folders, chunk models, extraction services
│   ├── faqs/                       # Institutional FAQ knowledge base
│   ├── feedback/                   # User answer rating & feedback
│   ├── rag/                        # Embeddings, retrieval, prompt synthesis, Gemini client
│   ├── media/                      # Uploaded files directory (excluded from git)
│   ├── static/                     # Backend admin static assets
│   ├── templates/                  # Email and administrative HTML templates
│   ├── tests/                      # Automated regression, auth, doc, and email tests
│   │   ├── testmail_client.py      # Reusable Testmail.app integration client
│   │   └── test_email_integration.py # Email test suite
│   ├── Dockerfile                  # Production container definition
│   ├── manage.py                   # Django CLI management script
│   └── requirements.txt            # Python dependencies
├── docs/                           # Architectural specs, database schema, guides
│   ├── architecture.md
│   ├── database-design.md
│   ├── deployment-guide.md
│   └── rag-pipeline.md
├── frontend/                       # React 19 + Vite frontend
│   ├── public/                     # Static icons and assets
│   ├── src/
│   │   ├── components/             # Reusable UI components (Modals, Nav, Cards)
│   │   ├── context/                # AuthContext, ThemeContext
│   │   ├── pages/                  # Student & Admin route views
│   │   ├── services/               # Axios API client services (auth, chat, docs, folders)
│   │   ├── styles/                 # Glassmorphic CSS and Tailwind styles
│   │   ├── App.jsx                 # Routing and application entry point
│   │   └── main.jsx                # DOM mounting
│   ├── Dockerfile                  # Production Nginx container definition
│   ├── nginx.conf                  # Nginx reverse proxy configuration
│   ├── package.json                # Frontend package dependencies
│   └── vite.config.js              # Vite bundler configuration
├── docker-compose.yml              # Multi-container orchestration (DB, API, Web)
├── render.yaml                     # Render deployment blueprint (Cloudflare R2 storage)
├── render.disk.yaml                # Render deployment blueprint (Persistent disk)
├── .env.example                    # Safe environment template (no secrets)
└── .gitignore                      # Security-first exclusions
```

---

## 7. Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm
- PostgreSQL 16 with pgvector (Optional — automatically falls back to local SQLite)

### Backend Setup

1. **Navigate to the backend directory and activate your virtual environment:**
   ```powershell
   # Windows
   cd backend
   ..\venv\Scripts\activate

   # Linux / macOS
   cd backend
   source ../venv/bin/activate
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Copy the example environment template to `.env` in the project root:
   ```bash
   cp ../.env.example ../.env
   ```
   *Edit `.env` to provide your `GEMINI_API_KEY`.*

4. **Apply database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **(Optional) Seed Demonstration Data:**
   ```bash
   python manage.py seed_demo_data
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Frontend Environment:**
   ```bash
   cp .env.example .env
   ```

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```

5. Access the application in your browser at `http://127.0.0.1:5173`.

---

## 8. Docker Deployment

To run the complete stack (PostgreSQL with pgvector, Django REST API, and React frontend with Nginx) in Docker:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Build and launch services
docker compose up -d --build
```

- **Frontend Client:** `http://localhost:80` (or `http://localhost:3000`)
- **Backend API:** `http://localhost:8000/api/v1/`
- **Swagger Documentation:** `http://localhost:8000/api/docs/swagger/`

---

## 9. API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register/` | Register new student account |
| `POST` | `/api/v1/auth/login/` | Authenticate and obtain JWT access/refresh tokens |
| `POST` | `/api/v1/auth/refresh/` | Refresh JWT access token |
| `GET` | `/api/v1/auth/me/` | Retrieve authenticated user profile |
| `POST` | `/api/v1/chat/ask/` | Submit question with folder/file scope; returns grounded answer & citations |
| `GET` | `/api/v1/chat/conversations/` | List student chat sessions |
| `GET` | `/api/v1/chat/conversations/{id}/` | Get full message history and citations |
| `POST` | `/api/v1/chat/messages/{id}/simplify/` | Restyle answer (Simple, Step-by-Step, Bullets) |
| `GET` | `/api/v1/documents/` | List uploaded documents with folder metadata |
| `POST` | `/api/v1/documents/upload/` | Upload document and trigger ingestion pipeline |
| `GET` | `/api/v1/documents/folders/` | List and create document management folders |
| `POST` | `/api/v1/documents/{id}/reprocess/` | Re-extract text, re-chunk, and re-embed document |
| `GET` | `/api/v1/admin/analytics/overview/` | Administrative dashboard metrics and KPIs |
| `GET` | `/api/v1/admin/analytics/knowledge-gaps/`| Unanswered query gap monitor |
| `GET` | `/api/v1/admin/audit-logs/` | Security and operational audit trail |

Interactive OpenAPI documentation is available at `/api/docs/swagger/` and `/api/docs/redoc/`.

---

## 10. Automated Testing

### Running the Test Suite
```bash
cd backend

# 1. Run all unit and regression tests
python manage.py test tests.test_auth tests.test_documents tests.test_security

# 2. Run Testmail offline integration tests (fast, no external requests)
python manage.py test tests.test_email_integration

# 3. Run Testmail live network tests (requires TESTMAIL_API_KEY and RUN_TESTMAIL_INTEGRATION=1)
RUN_TESTMAIL_INTEGRATION=1 python manage.py test tests.test_email_integration.TestmailLiveApiTests
```

---

## 11. Security Considerations

- **No Secrets in Source:** All sensitive tokens, API keys, database credentials, and signing secrets are strictly loaded through environment variables.
- **Strict Git Exclusions:** `.env`, `.env.*`, user uploads (`backend/media/`), local databases (`db.sqlite3`), vector caches, and virtual environments are explicitly excluded via `.gitignore`.
- **Stateless JWT Tokens:** Authentication utilizes short-lived JWT access tokens (default 60 mins) and refresh tokens with strict signature validation.
- **Role-Based Access Control (RBAC):** Admin endpoints (`/api/v1/admin/*`, document uploads, folder creation) require admin permissions; student access is strictly scoped.
- **Document Isolation & Privacy:** Chat transcripts, saved answers, and user profiles are isolated per user.
- **Sanitized Embeddings & Logging:** Sensitive credentials and keys are masked in application logs and test fixtures.
