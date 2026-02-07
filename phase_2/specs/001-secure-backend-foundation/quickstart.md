# Quickstart Guide: Backend Development

**Feature**: 001-secure-backend-foundation
**Last Updated**: 2026-02-05
**Prerequisites**: UV installed, Neon PostgreSQL database provisioned

---

## 1. Environment Setup

### 1.1 Install UV (if not already installed)

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify installation
uv --version
```

### 1.2 Configure Environment Variables

Create a `.env` file in the **project root** (not in `/backend`):

```bash
# .env
DATABASE_URL=postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-shared-with-frontend-min-32-chars
```

**Important**:
- `DATABASE_URL`: Get from Neon PostgreSQL dashboard (Connection String)
- `BETTER_AUTH_SECRET`: Must be the same value used by the Better Auth frontend
- Minimum 32 characters for `BETTER_AUTH_SECRET` (security requirement)
- Never commit `.env` to version control (add to `.gitignore`)

### 1.3 Initialize Backend Project

```bash
# From project root
cd backend

# Install dependencies (reads pyproject.toml)
uv sync

# Verify installation
uv run python --version  # Should show Python 3.13+
```

---

## 2. Database Initialization

### 2.1 Create Tables

Option A: **SQLModel auto-migration** (development only):

```bash
cd backend
uv run python -c "from db import engine; from models import SQLModel; SQLModel.metadata.create_all(engine)"
```

Option B: **Manual SQL** (recommended for production):

```sql
-- Run in Neon SQL Editor or via psql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

CREATE INDEX idx_task_user_id ON tasks(user_id, id);
```

### 2.2 Verify Connection

```bash
cd backend
uv run python -c "from db import engine; print('✅ Database connected:', engine.url)"
```

---

## 3. Running the Development Server

### 3.1 Start Server

```bash
cd backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Server will be available at**:
- Local: `http://localhost:8000`
- Network: `http://<your-ip>:8000`

### 3.2 Verify Health Check

```bash
curl http://localhost:8000/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T12:00:00Z"
}
```

### 3.3 Access Interactive API Docs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 4. Testing the API

### 4.1 Generate Test JWT Token

For local development, generate a test JWT token:

```python
# generate_token.py
from jose import jwt
from datetime import datetime, timedelta
import os

SECRET = os.getenv("BETTER_AUTH_SECRET", "test-secret-min-32-characters-long")
payload = {
    "sub": "test-user-123",  # user_id
    "exp": datetime.utcnow() + timedelta(days=1),
    "iat": datetime.utcnow()
}
token = jwt.encode(payload, SECRET, algorithm="HS256")
print(f"Test Token:\n{token}")
```

Run:
```bash
cd backend
uv run python generate_token.py
```

Copy the generated token for use in API requests.

### 4.2 Create a Task

```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "status": "pending"
  }'
```

**Expected Response** (201 Created):
```json
{
  "id": 1,
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "status": "pending",
  "user_id": "test-user-123",
  "created_at": "2026-02-05T12:00:00Z",
  "updated_at": "2026-02-05T12:00:00Z"
}
```

### 4.3 List Tasks

```bash
curl -X GET http://localhost:8000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Complete project documentation",
      "description": "Write comprehensive API docs",
      "status": "pending",
      "user_id": "test-user-123",
      "created_at": "2026-02-05T12:00:00Z",
      "updated_at": "2026-02-05T12:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 4.4 Get Single Task

```bash
curl -X GET http://localhost:8000/api/tasks/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4.5 Update Task

```bash
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

### 4.6 Delete Task

```bash
curl -X DELETE http://localhost:8000/api/tasks/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response** (204 No Content)

---

## 5. Running Tests

### 5.1 Run All Tests

```bash
cd backend
uv run pytest
```

**Expected Output**:
```
============================= test session starts ==============================
collected 15 items

tests/unit/test_models.py ........                                      [ 53%]
tests/integration/test_auth.py ...                                      [ 73%]
tests/contract/test_openapi.py ....                                     [100%]

============================== 15 passed in 2.34s ===============================
```

### 5.2 Run Specific Test Suites

```bash
# Unit tests only
uv run pytest tests/unit/

# Integration tests only
uv run pytest tests/integration/

# Contract tests only
uv run pytest tests/contract/

# Run with verbose output
uv run pytest -v

# Run with coverage report
uv run pytest --cov=. --cov-report=html
```

### 5.3 Run Single Test File

```bash
uv run pytest tests/integration/test_tasks.py -v
```

---

## 6. Common Issues & Troubleshooting

### Issue: "DATABASE_URL environment variable required"

**Solution**: Ensure `.env` file exists in project root with valid `DATABASE_URL`.

```bash
# Check if .env exists
ls -la .env

# Verify environment variable is loaded
cd backend
uv run python -c "import os; print(os.getenv('DATABASE_URL'))"
```

### Issue: "BETTER_AUTH_SECRET environment variable required"

**Solution**: Add `BETTER_AUTH_SECRET` to `.env` file (minimum 32 characters).

```bash
# Generate random secret
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Issue: "Could not connect to database"

**Possible Causes**:
1. Invalid DATABASE_URL format
2. Neon database not provisioned
3. Network/firewall issues

**Solution**:
```bash
# Test connection with psql
psql "$DATABASE_URL"

# Or with Python
cd backend
uv run python -c "from db import engine; engine.connect()"
```

### Issue: "401 Unauthorized" on API requests

**Possible Causes**:
1. Missing `Authorization` header
2. Invalid JWT token
3. Token expired
4. Wrong `BETTER_AUTH_SECRET`

**Solution**:
```bash
# Verify token structure
echo "YOUR_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq

# Generate new test token
cd backend
uv run python generate_token.py
```

### Issue: Port 8000 already in use

**Solution**:
```bash
# Kill process on port 8000 (Linux/macOS)
lsof -ti:8000 | xargs kill -9

# Or use different port
uv run uvicorn main:app --reload --port 8001
```

---

## 7. Development Workflow

### 7.1 Making Code Changes

1. Edit files in `backend/` directory
2. Server auto-reloads with `--reload` flag
3. Refresh browser/re-run curl commands to test changes

### 7.2 Adding New Dependencies

```bash
cd backend
uv add <package-name>  # Example: uv add pydantic-settings

# Update lockfile
uv lock

# Sync environment
uv sync
```

### 7.3 Code Quality Checks

```bash
# Format code (if ruff configured)
uv run ruff format .

# Lint code
uv run ruff check .

# Type checking (if mypy configured)
uv run mypy .
```

---

## 8. Deployment Checklist

Before deploying to production:

- [ ] Set production `DATABASE_URL` (Neon production database)
- [ ] Set production `BETTER_AUTH_SECRET` (match frontend)
- [ ] Run database migrations (not auto-create tables)
- [ ] Set `ENVIRONMENT=production` environment variable
- [ ] Disable debug mode and auto-reload
- [ ] Use production ASGI server (uvicorn with workers)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for production frontend domain
- [ ] Set up logging and monitoring
- [ ] Run security scan (e.g., `bandit`, `safety`)

**Production Start Command**:
```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --no-access-log
```

---

## 9. Useful Commands Reference

```bash
# Development
uv run uvicorn main:app --reload                   # Start dev server
uv run pytest                                      # Run tests
uv run pytest --cov                                # Run tests with coverage

# Database
uv run alembic revision --autogenerate -m "msg"    # Create migration (if using Alembic)
uv run alembic upgrade head                        # Apply migrations

# Dependency Management
uv add <package>                                   # Add dependency
uv remove <package>                                # Remove dependency
uv sync                                            # Sync environment with lockfile
uv lock                                            # Update lockfile

# Linting & Formatting
uv run ruff check .                                # Lint code
uv run ruff format .                               # Format code
uv run mypy .                                      # Type check

# Troubleshooting
uv run python -c "from db import engine; print(engine.url)"  # Test DB connection
uv run python -c "import sys; print(sys.executable)"         # Show Python path
```

---

## 10. Next Steps

- **Frontend Integration**: Coordinate with frontend team on JWT token format and API base URL
- **Add Features**: Extend with additional endpoints (e.g., task filtering, search)
- **Production Deployment**: Set up CI/CD pipeline and containerization (Docker)
- **Monitoring**: Integrate APM (e.g., Sentry, Datadog) for error tracking
- **Documentation**: Keep OpenAPI spec (`contracts/openapi.yaml`) updated

---

**Questions?** Check `data-model.md` for database schema details or `contracts/openapi.yaml` for API specifications.
