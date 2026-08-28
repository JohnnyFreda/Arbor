from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.capture import InterpretationResponse
from app.schemas.interpretation import InterpretationDecision
from app.services import interpretations as interpretation_service

router = APIRouter()


@router.patch("/{interpretation_id}", response_model=InterpretationResponse)
async def decide_interpretation(
    interpretation_id: int,
    decision: InterpretationDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept, edit, or dismiss a proposal.

    Accepting an actionable proposal (`task` or `blocker`) creates exactly one
    Task; accepting again returns the same one. Dismissing withdraws a task an
    earlier acceptance created, unless it has already been completed.
    """
    interpretation = interpretation_service.get_interpretation(
        db, current_user.id, interpretation_id
    )
    if not interpretation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interpretation not found"
        )

    try:
        return interpretation_service.apply_decision(db, interpretation, decision)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
