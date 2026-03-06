# Clinical Data Backend (FastAPI + PostgreSQL + SQLAlchemy)

## Run locally (without Docker)

1. Create venv and install deps:

```bash
py -3.12 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Copy env and configure:

```bash
copy .env.example .env
```

3. Run API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Run with Docker

```bash
copy .env.example .env
docker compose up --build
```

`api` container uses internal DB host `db:5432` automatically from `docker-compose.yml`.

## API

Base prefix: `/api/v1`

### Core endpoints

- `GET /api/v1/health`
- `GET /api/v1/medical-cases?offset=0&limit=2000`
- `GET /api/v1/diseases?offset=0&limit=2000`
- `GET /api/v1/control-points?offset=0&limit=2000`
- `GET /api/v1/lab-results?offset=0&limit=2000`
- `GET /api/v1/diagnosis-records?offset=0&limit=2000`
- `POST /api/v1/clinical-data/bulk-upsert` (admin only)

### Server analytics endpoints

- `POST /api/v1/analytics/group`
- `POST /api/v1/analytics/comparative`

### Auth endpoints

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Admin users endpoints (admin only)

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/{user_id}`
- `POST /api/v1/users/{user_id}/deactivate`
- `DELETE /api/v1/users/{user_id}` (legacy alias for deactivate)
- `POST /api/v1/users/{user_id}/reset-password`

## Auth & RBAC

Backend supports two auth modes:

1. JWT mode (recommended): set `JWT_SECRET_KEY`.
2. Static token mode (legacy compatibility): set `API_BEARER_TOKEN`.

Role checks are enforced server-side:

- Read endpoints: `admin`, `doctor`, `junior_researcher`, `researcher`, `senior_researcher`, `lead_researcher`
- Write endpoints `/clinical-data/bulk-upsert` and `/users*`: `admin`

Security rules:

- If both `JWT_SECRET_KEY` and `API_BEARER_TOKEN` are empty, API returns `500 Authentication is not configured`.
- Dev open-auth mode is possible only with `ALLOW_INSECURE_DEV_AUTH=true` and non-production `APP_ENV`.
- In `APP_ENV=production`, `JWT_SECRET_KEY` is mandatory.

## Bootstrap admin

On startup backend creates the first admin user only if all values are set:

- `BOOTSTRAP_ADMIN_LOGIN`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`

After first login, rotate credentials and clear bootstrap variables.

## Production notes

- In `APP_ENV=production`, automatic schema creation on startup is disabled.
- Use Alembic migrations for production database lifecycle.
- Configure strict CORS origins in `.env` (`CORS_ORIGINS`).
- Disable demo frontend auth: `VITE_ENABLE_DEMO_LOGIN=false`.
- Prefer HTTPS and reverse proxy with request-size limits.
