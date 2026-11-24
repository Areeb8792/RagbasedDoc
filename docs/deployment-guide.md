# Deployment and Operations Guide

This guide covers deploying the G38 AI College Assistant using Docker Compose or native local execution.

---

## 1. Quick Start with Docker Compose

The simplest way to run G38 in production or development is via Docker Compose:

```bash
# 1. Clone repository & configure environment
cp .env.example .env

# Edit .env and insert your GEMINI_API_KEY
# GEMINI_API_KEY=your_gemini_api_key_here

# 2. Build and launch all 3 services
docker compose up -d --build
```

### Services Launched:
1. **`db`** (`pgvector/pgvector:pg16`): PostgreSQL 16 on port 5432 with pgvector enabled.
2. **`backend`** (Django 6 + Gunicorn): Runs migrations, seeds demo documents, and listens on port 8000.
3. **`frontend`** (Nginx + React 19): Serves client UI on port 80 (or 3000) and reverse-proxies API calls.

---

## 2. Native Local Development Setup

If running without Docker:

### Prerequisites:
- Python 3.12+
- Node.js 20+ & npm

### Backend Setup:
```bash
# 1. Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Run database migrations
cd backend
python manage.py migrate

# 4. Seed initial demonstration policies and accounts
python manage.py seed_demo_data

# 5. Start the backend development server
python manage.py runserver 127.0.0.1:8000
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 3. Seed Accounts for Reviewers

- **Demo Administrator:**
  - Email / Username: `admin` or `admin@college.edu`
  - Password: `AdminPass123!`
  - Role: `admin` (Has access to Document Management, Knowledge Gaps, Analytics, Audit Logs)

- **Demo Student:**
  - Email / Username: `student` or `student@college.edu`
  - Password: `StudentPass123!`
  - Role: `student` (Has access to Student Dashboard, AI Chat, Knowledge Explorer, Saved Answers)
