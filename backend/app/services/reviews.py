"""Assembling a proposed end-of-day diary entry.

Deterministic: everything here comes from rows the user already created. No
model is involved, so the review works with no interpreter configured and
cannot invent work that did not happen. An AI summary can sit on top later,
behind the same shape.

The result is a proposal. Nothing is written until the user saves it, and the
entry they save is an ordinary Entry -- reflection stays the diary's job.
See docs/product/user-flows.md, flow 6.
"""

from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models.capture import Capture
from app.db.models.entry import Entry
from app.db.models.interpretation import Interpretation, InterpretationStatus
from app.db.models.project import Project
from app.db.models.task import Task, TaskStatus, TaskType

# Priority order for picking a first action. Anything unrecognised sorts last.
_PRIORITY_RANK = {"high": 0, "medium": 1, "low": 2}


def local_today(utc_offset_minutes: int) -> date:
    """The date it currently is for the user, not for the server."""
    return (datetime.now(timezone.utc) + timedelta(minutes=utc_offset_minutes)).date()


def _day_bounds(day: date, utc_offset_minutes: int) -> tuple[datetime, datetime]:
    """The user's local day, expressed as the UTC instants that bound it.

    Timestamps are stored in UTC; "today" is a local date. Comparing one
    against the other drops the evening for anyone west of UTC -- at 23:00 in
    UTC-5 a capture is already stamped tomorrow, so it vanishes from today's
    review. For a tool whose promise is not losing thoughts, that is not a
    rounding error.

    Compared as a half-open range rather than by casting the column to a date:
    casting behaves differently across SQLite and Postgres, and a range lets
    the index on the timestamp do the work.
    """
    local_start = datetime.combine(day, time.min)
    start = local_start - timedelta(minutes=utc_offset_minutes)
    return start, start + timedelta(days=1)


def _rank(task: Task) -> tuple[int, int]:
    return (_PRIORITY_RANK.get(task.priority or "", 3), task.id)


def build_daily_review(
    db: Session, user_id: int, day: date, utc_offset_minutes: int = 0
) -> dict:
    """Gather the day's material and propose an entry from it."""
    start, end = _day_bounds(day, utc_offset_minutes)

    captures = (
        db.query(Capture)
        .filter(
            Capture.user_id == user_id,
            Capture.created_at >= start,
            Capture.created_at < end,
        )
        .order_by(Capture.created_at)
        .all()
    )

    completed = (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.status == TaskStatus.DONE,
            Task.completed_at >= start,
            Task.completed_at < end,
        )
        .order_by(Task.completed_at)
        .all()
    )

    open_tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id, Task.status == TaskStatus.OPEN)
        .all()
    )
    blockers = [t for t in open_tasks if t.type == TaskType.BLOCKER]
    unfinished = sorted(
        (t for t in open_tasks if t.type == TaskType.TASK), key=_rank
    )

    projects = {p.id: p.name for p in db.query(Project).filter(Project.user_id == user_id)}
    existing = (
        db.query(Entry)
        .filter(Entry.user_id == user_id, Entry.date == day)
        .first()
    )

    return {
        "date": day,
        "proposed_title": _title(completed, captures),
        "proposed_body": _body(captures, completed, blockers, projects),
        "proposed_looking_ahead": _looking_ahead(unfinished, blockers),
        "capture_count": len(captures),
        "completed_count": len(completed),
        "open_count": len(unfinished),
        "blocker_count": len(blockers),
        "existing_entry_id": existing.id if existing else None,
        "is_empty": not captures and not completed,
    }


def _title(completed: List[Task], captures: List[Capture]) -> Optional[str]:
    """Only propose a title when the day has an obvious headline.

    One completed task is a clear answer. Several is a summary the user should
    write themselves, and guessing one would put words in their mouth.
    """
    if len(completed) == 1:
        return completed[0].title
    return None


def _accepted_type(capture: Capture) -> Optional[str]:
    interpretation: Optional[Interpretation] = capture.interpretation
    if interpretation and interpretation.status in (
        InterpretationStatus.ACCEPTED,
        InterpretationStatus.EDITED,
    ):
        return interpretation.type
    return None


def _body(
    captures: List[Capture],
    completed: List[Task],
    blockers: List[Task],
    projects: dict,
) -> str:
    """Markdown, matching how entries are already written and rendered."""
    sections: List[str] = []

    if completed:
        lines = ["**Finished**", ""]
        for task in completed:
            project = projects.get(task.project_id)
            lines.append(f"- {task.title}" + (f" — {project}" if project else ""))
        sections.append("\n".join(lines))

    if captures:
        lines = ["**Captured**", ""]
        for capture in captures:
            # The capture's own words, not the interpretation's title. The raw
            # text is the record; a diary that quotes the paraphrase loses it.
            text = " ".join(capture.content.split())
            kind = _accepted_type(capture)
            lines.append(f"- {text}" + (f" _({kind})_" if kind else ""))
        sections.append("\n".join(lines))

    if blockers:
        lines = ["**Still blocked**", ""]
        for task in blockers:
            project = projects.get(task.project_id)
            lines.append(f"- {task.title}" + (f" — {project}" if project else ""))
        sections.append("\n".join(lines))

    return "\n\n".join(sections)


def _looking_ahead(unfinished: List[Task], blockers: List[Task]) -> str:
    """Unfinished work and one suggested first action.

    The suggestion is the highest-priority open task, not an invented next
    step -- picking from work the user already accepted keeps this honest.
    A blocker outranks ordinary work: nothing else moves until it does.
    """
    if not unfinished and not blockers:
        return ""

    first = (sorted(blockers, key=_rank) or unfinished)[0]
    # Ends with a full stop: the title runs straight into the next sentence
    # otherwise, and task titles do not carry their own punctuation.
    parts: List[str] = [f"Start with: {first.title}."]

    remaining = len(unfinished) + len(blockers) - 1
    if remaining > 0:
        # Blockers still counted excludes the one just named, or the sentence
        # tells the user two things are blocked while pointing at one of them.
        blocked_left = len([b for b in blockers if b.id != first.id])
        tail = f"{remaining} other{'s' if remaining != 1 else ''} still open"
        if blocked_left:
            tail += f", {blocked_left} of them blocked"
        parts.append(tail + ".")

    return " ".join(parts)
