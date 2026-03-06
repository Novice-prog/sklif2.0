# Clinical Data Management System

## Project structure

- `frontend/` - React + Vite user interface
- `backend/` - FastAPI + PostgreSQL + SQLAlchemy service
- `TECHNICAL_AUDIT.md` - full technical audit and production recommendations

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend code and API adapters:

- `frontend/src/api/clinicalDataApi.ts`
- `frontend/src/api/contracts.ts`
- `frontend/src/backend/INTEGRATION_GUIDE.md`

## Run backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

See `backend/README.md` for database/auth details.

## Frontend-backend connection

Set `VITE_API_BASE_URL` in `frontend/.env` to backend URL, for example:

```env
VITE_API_BASE_URL=http://localhost:8000
```
