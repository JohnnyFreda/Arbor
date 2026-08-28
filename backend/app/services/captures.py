"""Capture persistence and the interpretation hand-off.

The load-bearing rule here: a capture is committed before any model runs, in
its own transaction. Interpretation happens afterwards and can fail freely
without taking the user's thought down with it. See ADR-001 and
docs/development/definition-of-done.md.
"""

import logging
from typing import List, Optional, Tuple

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db.models.capture import Capture, ProcessingStatus
from app.db.models.interpretation import Interpretation, InterpretationStatus
from app.db.models.project import Project
from app.db.session import SessionLocal
from app.schemas.capture import CaptureCreate
from app.services import interpretation as interpretation_service
from app.services.project_matching import match_project

logger = logging.getLogger(__name__)


def create_capture(
    db: Session, user_id: int, data: CaptureCreate
) -> Tuple[Capture, bool]:
    """Store a capture and commit immediately.

    Returns (capture, created). `created` is False when an existing capture was
    returned for a repeated client_token, so the caller can answer 200 rather
    than 201 without creating a duplicate.
    """
    if data.client_token:
        existing = (
            db.query(Capture)
            .filter(
                Capture.user_id == user_id,
                Capture.client_token == data.client_token,
            )
            .first()
        )
        if existing:
            return existing, False

    capture = Capture(
        user_id=user_id,
        content=data.content,
        source=data.source,
        client_token=data.client_token,
        processing_status=ProcessingStatus.PENDING,
    )
    db.add(capture)
    # Commit here, deliberately. Nothing downstream may join this transaction.
    db.commit()
    db.refresh(capture)
    return capture, True


def list_captures(
    db: Session,
    user_id: int,
    processing_status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Capture]:
    """Most recent first -- the inbox reads newest-down."""
    query = db.query(Capture).filter(Capture.user_id == user_id)
    if processing_status:
        query = query.filter(Capture.processing_status == processing_status)
    return (
        query.order_by(Capture.created_at.desc(), Capture.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_capture(db: Session, user_id: int, capture_id: int) -> Optional[Capture]:
    return (
        db.query(Capture)
        .filter(Capture.id == capture_id, Capture.user_id == user_id)
        .first()
    )


def run_interpretation(capture_id: int) -> None:
    """Interpret a stored capture. Safe to fail.

    Opens its own session: this runs after the response has been returned and
    the request-scoped session is already closed.
    """
    db = SessionLocal()
    try:
        capture = db.query(Capture).filter(Capture.id == capture_id).first()
        if capture is None:
            return
        if capture.processing_status != ProcessingStatus.PENDING:
            # Already handled, or being handled. Don't produce a second proposal.
            return

        interpreter = interpretation_service.get_interpreter()
        if interpreter is None:
            capture.processing_status = ProcessingStatus.SKIPPED
            db.commit()
            return

        capture.processing_status = ProcessingStatus.PROCESSING
        db.commit()

        try:
            proposal = interpreter.interpret(capture.content)
        except Exception:
            logger.exception(
                "Interpretation failed for capture %s; capture preserved", capture_id
            )
            capture.processing_status = ProcessingStatus.FAILED
            db.commit()
            return

        try:
            _store_proposal(
                db,
                capture,
                proposal,
                getattr(interpreter, "name", None),
                getattr(interpreter, "confidence_is_calibrated", True),
            )
        except (ValidationError, ValueError):
            logger.exception(
                "Interpreter returned unusable output for capture %s", capture_id
            )
            db.rollback()
            capture.processing_status = ProcessingStatus.FAILED
            db.commit()
    finally:
        db.close()


def _match_project(db: Session, user_id: int, content: str) -> Optional[int]:
    """Associate the capture with a project, from its text alone.

    Only the user's own projects are considered, so a capture cannot be
    attached to someone else's by any route. No model is involved -- see
    project_matching.py and ADR-008.
    """
    projects = (
        db.query(Project).filter(Project.user_id == user_id).order_by(Project.name).all()
    )
    return match_project(content, projects)


def _store_proposal(
    db: Session, capture: Capture, proposal, model_name, confidence_is_calibrated=True
) -> None:
    """Persist a validated proposal alongside its capture."""
    # Derived here, from the capture's own words, rather than taken from the
    # proposal. The interpreter is never given project ids, so it has nothing
    # to guess with.
    project_id = _match_project(db, capture.user_id, capture.content)

    db.add(
        Interpretation(
            capture_id=capture.id,
            type=proposal.type,
            suggested_title=proposal.suggested_title,
            suggested_project_id=project_id,
            suggested_priority=proposal.suggested_priority,
            suggested_next_action=proposal.suggested_next_action,
            confidence=proposal.confidence,
            status=InterpretationStatus.PROPOSED,
            model=model_name,
            confidence_is_calibrated=confidence_is_calibrated,
        )
    )
    capture.processing_status = ProcessingStatus.INTERPRETED
    db.commit()


def reset_for_retry(db: Session, capture: Capture) -> None:
    """Move a failed or skipped capture back to pending so it can be re-run."""
    capture.processing_status = ProcessingStatus.PENDING
    db.commit()


def delete_capture(db: Session, capture: Capture) -> None:
    db.delete(capture)
    db.commit()
