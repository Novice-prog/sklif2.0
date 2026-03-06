# Technical Audit Report

## 1) Found issues and risks

### Architecture
- `App.tsx` is still a high-complexity orchestrator and contains mixed concerns (UI state, data mutations, import sync, role checks).
- Legacy Supabase auth/admin flows coexist with the new Python backend, creating dual-control architecture risk.
- Analytics logic has historically been frontend-heavy; this causes CPU pressure in browser and inconsistent computation paths.
- Domain model duplication (`src/types.ts` and `src/types/index.ts`) increases drift risk.

### Security
- Legacy frontend auth/admin relies on Supabase anon/public flows and demo credentials in code paths.
- Frontend role checks are client-side and must not be treated as authorization controls.
- Bearer token integration exists, but full RBAC/JWT policy is not yet fully implemented.

### Performance
- Prior frontend analytical loops were O(N*M*K) with repeated scans. Some were optimized with maps, but full server-side analytics migration is still in progress.
- No centralized query cache layer yet.
- API pagination now added for core reads, but frontend still fetches large chunks in one shot for compatibility.

### Database and API correctness
- Initial backend used startup `create_all`; now gated by env, but production migrations still need Alembic workflow.
- Bulk upsert works transactionally, but no audit trail table yet for mutation provenance.
- API now has analytics endpoints, but no background job queue for long-running analytics.

## 2) Proposed architecture

### Target architecture
- Frontend: React presentation + thin state orchestration + API client + optional cache/query layer.
- Backend: FastAPI controllers -> services -> SQLAlchemy repository/model layer.
- DB: PostgreSQL as source of truth with indexed operational tables and dedicated analytical read endpoints.

### Responsibility split
- Frontend: rendering, interactions, local optimistic UX only.
- Backend: filtering, aggregation, statistical/analytical computations, authorization, audit logging.

### Security model
- JWT access token with role claims (`admin`, `doctor`, `researcher`, ...).
- Server-side RBAC for each endpoint.
- Disable demo auth and legacy admin mode by default via env flags.

## 3) Improved project structure

- `backend/app/api/v1/endpoints/clinical_data.py` (controllers)
- `backend/app/api/v1/endpoints/analytics.py` (controllers)
- `backend/app/services/clinical_data.py` (business/data logic)
- `backend/app/services/analytics.py` (server analytics)
- `backend/app/models/clinical.py` (DB models)
- `backend/app/schemas/clinical.py` (contracts)
- `backend/app/core/config.py` (config)
- `backend/app/main.py` (app bootstrap, middleware, handlers)
- `src/api/httpClient.ts` (frontend transport)
- `src/api/clinicalDataApi.ts` (frontend API adapter)
- `src/api/contracts.ts` (frontend contracts)

## 4) Key implemented code changes

- Added backend core endpoints with pagination params (`offset`, `limit`).
- Added transaction-safe bulk upsert (`ON CONFLICT DO UPDATE`).
- Added server analytics endpoints:
  - `/api/v1/analytics/group`
  - `/api/v1/analytics/comparative`
- Added backend middleware for request ID propagation and standardized error payloads.
- Added frontend backend-mode synchronization in `App.tsx`:
  - initial load from backend
  - import sync through backend bulk upsert
- Added frontend API methods for server analytics.
- Added env flags for production-safe frontend behavior:
  - `VITE_USE_BACKEND`
  - `VITE_ENABLE_DEMO_LOGIN`
  - `VITE_ENABLE_SUPABASE_ADMIN`

## 5) Recommendations for further development

1. Implement full JWT + RBAC on backend and remove legacy Supabase admin/user management from frontend.
2. Add Alembic migrations and CI checks for schema drift.
3. Add test layers:
   - Backend: unit tests for services + integration API tests with test DB.
   - Frontend: component tests + API adapter tests.
4. Introduce query/cache layer on frontend (e.g. TanStack Query) for scalable data fetching.
5. Add backend audit tables for sensitive data changes (who/when/what).
6. Move advanced statistical tests fully to backend with validated numerical libraries and reproducibility controls.
7. Add observability stack (structured logs, metrics, request tracing, error aggregation).
