from datetime import date as date_type
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.auth import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.review import DailyReviewResponse
from app.services import reviews as review_service

router = APIRouter()


@router.get("/daily", response_model=DailyReviewResponse)
async def get_daily_review(
    day: Optional[date_type] = Query(
        None,
        alias="date",
        description="The day to review, in the caller's local calendar. "
        "Defaults to today in the timezone given by utc_offset_minutes.",
    ),
    utc_offset_minutes: int = Query(
        0,
        ge=-840,
        le=840,
        description="The caller's offset east of UTC, i.e. JavaScript's "
        "-new Date().getTimezoneOffset(). Timestamps are stored in UTC and a "
        "day is local, so without this the evening is attributed to the wrong "
        "day for anyone west of UTC. Defaults to UTC.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Propose an end-of-day entry from the day's captures, completed work and
    open items. Read-only: nothing is written until the user saves an entry."""
    return review_service.build_daily_review(
        db,
        current_user.id,
        day or review_service.local_today(utc_offset_minutes),
        utc_offset_minutes,
    )
