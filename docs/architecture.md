# G38 — AI College Assistant Architecture Documentation

## 1. System Overview

**G38 – AI College Assistant** is an institutional knowledge platform engineered to provide reliable, verifiable, and evidence-grounded answers to college students, faculty, and administrators.

The core guiding principle is **Evidence-First AI**:
- The platform answers queries strictly using retrieved institutional documentation (regulations, examination guidelines, policies, handbooks, notices).
- The platform prefers an honest *"I could not find sufficient information regarding this in the available official college documents"* over unsupported or hallucinated policy responses.
- Unanswerable inquiries are tracked via an **Intelligent Knowledge Gap Monitor** so institutional administrators know which documents are missing.

---

## 2. Component Architecture

```text
                  STUDENT / ADMINISTRATOR
                            │
                            ▼
              React + Vite + Tailwind CSS Frontend
                            │
                       Axios / REST
                            │
                            ▼
                  Django REST Framework
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
    accounts            documents              chat
        │                   │                   │
        │           Document Ingestion          │
        │           PyMuPDF / docx / PPTX       │
        │                   │                   │
        │             Recursive Chunker         │
        │                   │                   │
        │          Sentence Transformers        │
        │                   │                   │
        │                   ▼                   │
        │          pgvector / PostgreSQL        │
        │                                       │
        └───────────────────┬───────────────────┘
                            ▼
                        RAG Engine
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         Hybrid Retrieval           Gemini API
       Dense Vector + BM25               │
               │                         │
               └────────────┬────────────┘
                            ▼
                     Grounded Response
                            │
                     Verified Citations
                            │
                            ▼
                  React UI Client
```

---

## 3. Technology Stack

### Frontend
- **Framework:** React 19 + Vite 8
- **Styling & Layout:** Tailwind CSS v4
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Analytics Visualization:** Recharts
- **Markdown Rendering:** React Markdown
- **User Notifications:** React Hot Toast
- **API Client:** Axios with JWT interceptor & refresh token handling

### Backend
- **Core Framework:** Python 3.12 + Django 6.1
- **REST Engine:** Django REST Framework 3.18
- **Authentication:** DRF Simple JWT (Access & Refresh tokens)
- **CORS Management:** django-cors-headers
- **Filtering & Search:** django-filter
- **API Documentation:** drf-spectacular (OpenAPI 3.0 / Swagger UI)
- **Application Server:** Gunicorn

### Database & Vector Storage
- **Primary Database:** PostgreSQL 16
- **Vector Search:** pgvector (384-dimensional cosine similarity)
- **Local Fallback:** SQLite with numpy-based cosine similarity vector computation

### Document Extraction & NLP
- **PDF Extraction:** PyMuPDF (fitz) with page preserving
- **DOCX Extraction:** python-docx with section and table preserving
- **PPTX Extraction:** python-pptx with slide tracking
- **Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-d normalized vectors)
- **LLM Integration:** Google Gemini API (via official `google-genai` SDK)
