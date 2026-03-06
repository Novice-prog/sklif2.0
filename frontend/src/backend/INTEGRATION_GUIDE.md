# Frontend -> Python Backend Integration Guide

This frontend is prepared for a production backend on Python + PostgreSQL + SQLAlchemy.

## 1) API Base URL
Set `VITE_API_BASE_URL` in environment:

- development: `http://localhost:8000`
- staging/production: backend gateway URL

## 2) Expected API contract
The frontend adapter is defined in `src/api/clinicalDataApi.ts` and contracts in `src/api/contracts.ts`.

Required endpoints:
- `GET /api/v1/medical-cases`
- `GET /api/v1/diseases`
- `GET /api/v1/control-points`
- `GET /api/v1/lab-results`
- `GET /api/v1/diagnosis-records`
- `POST /api/v1/clinical-data/bulk-upsert`

## 3) Backend recommendations (FastAPI + SQLAlchemy)
- Use UUID primary keys for all entities.
- Add composite indexes for high-volume reads:
  - `(medical_case_id)` on diseases
  - `(disease_id, date)` on control_points
  - `(control_point_id, indicator_id)` on lab_results
  - `(control_point_id)` on diagnosis_records
- Use server-side pagination for all list endpoints.
- Add optimistic locking (`updated_at` or version field) for concurrent edits.
- Return deterministic ordering from backend for reproducible analytics.

## 4) Security
- Use JWT access token; frontend sends `Authorization: Bearer <token>`.
- Do not return raw passwords from API.
- Enforce RBAC on backend only (frontend role checks are informational).

## 5) Performance targets
- Bulk import API should accept batched payloads and process in transactions.
- Add query-level filtering parameters to avoid transferring whole datasets.
- Prefer cursor pagination for very large tables.
