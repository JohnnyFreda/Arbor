from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.api import (
    auth, entries, projects, tags, calendar, insights, captures,
    interpretations, tasks,
)

# Configure logging
logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


app = FastAPI(
    title="Arbor API",
    description="A full-stack developer diary application",
    version="1.0.0"
)


# CORS middleware - must be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(entries.router, prefix="/api/v1/entries", tags=["entries"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(tags.router, prefix="/api/v1/tags", tags=["tags"])
app.include_router(calendar.router, prefix="/api/v1/calendar", tags=["calendar"])
app.include_router(insights.router, prefix="/api/v1/insights", tags=["insights"])
app.include_router(captures.router, prefix="/api/v1/captures", tags=["captures"])
app.include_router(interpretations.router, prefix="/api/v1/interpretations", tags=["interpretations"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])


@app.get("/")
async def root():
    return {"message": "Arbor API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


