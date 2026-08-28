from pydantic import BaseModel
from datetime import date as date_type
from typing import Optional


class DailyReviewResponse(BaseModel):
    """A proposed diary entry, assembled from the day's own rows.

    Nothing here is saved. The user reviews it and saves an ordinary Entry,
    so the diary stays authored rather than generated.
    """

    date: date_type
    proposed_title: Optional[str] = None
    proposed_body: str
    proposed_looking_ahead: str

    # Counts, so the UI can explain what the proposal was built from rather
    # than presenting it as having appeared from nowhere.
    capture_count: int
    completed_count: int
    open_count: int
    blocker_count: int

    # Set when a diary entry for this date already exists, so the UI can send
    # the user to edit it instead of silently creating a second one.
    existing_entry_id: Optional[int] = None

    # True when there is nothing to review. A quiet day is not an error.
    is_empty: bool
