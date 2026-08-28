"""Applying a user's decision to a proposal.

Accepting an actionable proposal creates exactly one Task; accepting again
returns the same one. Dismissing reverses a Task an earlier acceptance created,
because AI suggestions have to stay reversible -- see
docs/development/definition-of-done.md.
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.db.models.capture import Capture
from app.db.models.interpretation import Interpretation, InterpretationStatus
from app.db.models.project import Project
from app.db.models.task import Task, TaskStatus, TaskType
from app.schemas.interpretation import InterpretationDecision

# Types that earn a Task. Everything else resolves as reference state: the
# capture and its accepted interpretation are already the note. See ADR-006.
ACTIONABLE_TYPES = set(TaskType.ALL)

AFFIRMATIVE = (InterpretationStatus.ACCEPTED, InterpretationStatus.EDITED)

# A title has to come from somewhere; a capture is not guaranteed to produce one.
_TITLE_FALLBACK_LENGTH = 80


def get_interpretation(
    db: Session, user_id: int, interpretation_id: int
) -> Optional[Interpretation]:
    """Fetch a proposal, scoped to its owner through the parent capture."""
    return (
        db.query(Interpretation)
        .join(Capture, Interpretation.capture_id == Capture.id)
        .filter(Interpretation.id == interpretation_id, Capture.user_id == user_id)
        .first()
    )


def apply_decision(
    db: Session, interpretation: Interpretation, decision: InterpretationDecision
) -> Interpretation:
    """Record the user's verdict and reconcile the Task it implies."""
    if decision.status == InterpretationStatus.EDITED:
        _apply_edits(db, interpretation, decision)

    interpretation.status = decision.status

    if decision.status in AFFIRMATIVE:
        _ensure_task(db, interpretation)
    else:
        _withdraw_task(db, interpretation)

    db.commit()
    db.refresh(interpretation)
    return interpretation


def _apply_edits(
    db: Session, interpretation: Interpretation, decision: InterpretationDecision
) -> None:
    """Overwrite proposed fields with the user's corrections.

    The user is authoritative here -- their edit replaces the model's guess
    rather than being merged with it. See Principle 3.
    """
    if decision.type is not None:
        interpretation.type = decision.type
    if decision.suggested_title is not None:
        interpretation.suggested_title = decision.suggested_title
    if decision.suggested_priority is not None:
        interpretation.suggested_priority = decision.suggested_priority
    if decision.suggested_next_action is not None:
        interpretation.suggested_next_action = decision.suggested_next_action

    if decision.suggested_project_id is not None:
        # 0 clears the association, matching how entries handle it.
        if decision.suggested_project_id == 0:
            interpretation.suggested_project_id = None
        else:
            owned = (
                db.query(Project)
                .filter(
                    Project.id == decision.suggested_project_id,
                    Project.user_id == interpretation.capture.user_id,
                )
                .first()
            )
            if owned is None:
                raise ValueError("Project not found")
            interpretation.suggested_project_id = decision.suggested_project_id


def _existing_task(db: Session, interpretation: Interpretation) -> Optional[Task]:
    return (
        db.query(Task)
        .filter(Task.source_interpretation_id == interpretation.id)
        .first()
    )


def _ensure_task(db: Session, interpretation: Interpretation) -> Optional[Task]:
    """Create the Task this proposal implies, at most once.

    Returns None for non-actionable types, which is the normal path for a
    thought, idea, or note.
    """
    if interpretation.type not in ACTIONABLE_TYPES:
        # A proposal edited down from `task` to `note` withdraws its task.
        _withdraw_task(db, interpretation)
        return None

    existing = _existing_task(db, interpretation)
    if existing is not None:
        # Accepting twice is not an error, but it is not a second task either.
        # Re-accepting a previously dismissed proposal revives its task.
        if existing.status == TaskStatus.DROPPED:
            existing.status = TaskStatus.OPEN
        return existing

    capture = interpretation.capture
    task = Task(
        user_id=capture.user_id,
        project_id=interpretation.suggested_project_id,
        type=interpretation.type,
        title=_title_for(interpretation, capture),
        notes=interpretation.suggested_next_action,
        status=TaskStatus.OPEN,
        priority=interpretation.suggested_priority,
        source_capture_id=capture.id,
        source_interpretation_id=interpretation.id,
    )
    db.add(task)
    return task


def _withdraw_task(db: Session, interpretation: Interpretation) -> None:
    """Drop the task this proposal created, if the work has not been done.

    A completed task is left alone: dismissing the suggestion should not erase
    work the user actually finished.
    """
    task = _existing_task(db, interpretation)
    if task is not None and task.status == TaskStatus.OPEN:
        task.status = TaskStatus.DROPPED


def _title_for(interpretation: Interpretation, capture: Capture) -> str:
    """Prefer the proposed title; fall back to the start of the raw capture."""
    if interpretation.suggested_title and interpretation.suggested_title.strip():
        return interpretation.suggested_title.strip()

    text = " ".join(capture.content.split())
    if len(text) <= _TITLE_FALLBACK_LENGTH:
        return text
    return text[: _TITLE_FALLBACK_LENGTH - 1].rstrip() + "…"
