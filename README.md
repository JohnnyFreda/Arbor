# Arbor

A developer operating workspace — capture unstructured thought, connect the context scattered across your work systems, and turn both into structured, actionable work.

The core loop:

> Capture → Understand → Plan → Execute → Reflect

Arbor began as a developer journal and is expanding into a persistent workspace and context layer that supports both human reflection and agent-assisted work. See [`docs/product/vision.md`](docs/product/vision.md) for the full picture and [ADR-005](docs/decisions/005-diary-to-workspace.md) for why the scope changed.

## Live Demo

**[Try the app →](https://dev-diary-psi.vercel.app)**

Use **Continue as guest** to explore without signing up. The demo may take a moment to load after inactivity (free-tier backend spin-up).

The deployment is still named `dev-diary`; renaming it changes a live URL and is sequenced separately. See [ADR-007](docs/decisions/007-rename-to-arbor.md).

## Status

**Shipped today** — the journal foundation:

- User authentication with JWT (access + refresh tokens)
- Daily entry logging with markdown support
- Project and tag management
- Calendar view with entry visualization
- Dashboard with insights (streak, mood trends)
- Dark mode support
- Mobile responsive design

**In progress** — the workspace loop. Universal capture, an inbox, AI interpretation, and a developer dashboard. Scope is defined in [`docs/roadmap/mvp.md`](docs/roadmap/mvp.md); external integrations and agent capability are deliberately out of MVP scope.

The diary domain is retained rather than replaced. Diary entries model reflection; Captures model raw incoming thought. They solve different problems.

## Documentation

[`docs/`](docs/README.md) is the source of truth for product intent, architecture, and durable decisions. Contributors — human or AI — should start there.

| | |
|---|---|
| [Vision](docs/product/vision.md) | What Arbor is and why it exists |
| [Principles](docs/product/principles.md) | Product and UX rules |
| [Terminology](docs/product/terminology.md) | Canonical domain language |
| [MVP](docs/roadmap/mvp.md) | Current product boundary |
| [Architecture](docs/architecture/overview.md) | System design and module boundaries |
| [Decisions](docs/decisions/) | ADRs — why things are the way they are |
| [Conventions](docs/development/conventions.md) | Development conventions |
| [Definition of Done](docs/development/definition-of-done.md) | Completion bar |

[`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md) define how AI agents should work in this repository.

## Tech Stack

### Backend
- FastAPI
- Python
- SQLAlchemy + Alembic
- PostgreSQL
- JWT Authentication

### Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- React Query
- React Router

## Getting Started

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and secret key
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
```bash
cp .env.example .env
# Leave VITE_API_URL empty for dev (proxy forwards /api to backend). For production, set to your backend URL.
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`. With the backend running and the dev proxy (or `VITE_API_URL`) configured, the frontend uses the FastAPI backend and PostgreSQL for all data; app data is no longer stored in localStorage.

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core utilities (auth, config, security)
│   │   ├── db/           # Database models and session
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── tests/        # Tests
│   ├── alembic/          # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── context/      # React context (auth, theme)
│   │   ├── pages/        # Page components
│   │   └── App.tsx
│   └── package.json
├── docs/                 # Product, architecture, and decision records
├── CLAUDE.md             # Agent guidance
└── AGENTS.md             # Agent operating rules
```

## API Documentation

Once the backend server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Testing

### Backend Tests
```bash
cd backend
pytest
```

Testing priorities are described in [`docs/development/testing.md`](docs/development/testing.md).

## Deployment

The live demo uses a fully free stack:

| Component | Service | Notes |
|-----------|---------|--------|
| Frontend | [Vercel](https://vercel.com) | Root directory: `frontend`. Env: `VITE_API_URL` = backend URL. |
| Backend | [Render](https://render.com) | Web Service, root: `backend`. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Python 3.12 (`runtime.txt`). |
| Database | [Neon](https://neon.tech) | PostgreSQL. Connection string as `DATABASE_URL` on Render. |

**Backend env (Render):** `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS` (your Vercel frontend URL, e.g. `https://dev-diary-psi.vercel.app`).

**Frontend env (Vercel):** `VITE_API_URL` = your Render backend URL only (no path, no trailing slash).

Push to `main` to trigger automatic redeploys on both Vercel and Render.

## License

MIT
