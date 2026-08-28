from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.auth import get_current_user
from app.db.models.capture import ProcessingStatus
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.capture import CaptureCreate, CaptureResponse, ProcessingStatusLiteral
from app.services import captures as capture_service

router = APIRouter()


@router.post("", response_model=CaptureResponse, status_code=status.HTTP_201_CREATED)
async def create_capture(
    capture_data: CaptureCreate,
    background_tasks: BackgroundTasks,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Store a thought.

    The capture is committed before interpretation is scheduled, so a model
    outage costs the user a proposal, never the thought itself.

    Returns 201 for a new capture, or 200 when a repeated client_token matched
    one that already exists.
    """
    capture, created = capture_service.create_capture(db, current_user.id, capture_data)

    if created:
        background_tasks.add_task(capture_service.run_interpretation, capture.id)
    else:
        response.status_code = status.HTTP_200_OK

    return capture


@router.get("", response_model=List[CaptureResponse])
async def get_captures(
    processing_status: Optional[ProcessingStatusLiteral] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List captures, newest first. Filter by processing_status for the inbox."""
    return capture_service.list_captures(
        db=db,
        user_id=current_user.id,
        processing_status=processing_status,
        limit=limit,
        offset=offset,
    )


@router.get("/{capture_id}", response_model=CaptureResponse)
async def get_capture(
    capture_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    capture = capture_service.get_capture(db, current_user.id, capture_id)
    if not capture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Capture not found"
        )
    return capture


@router.post("/{capture_id}/interpret", response_model=CaptureResponse)
async def retry_interpretation(
    capture_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-run interpretation for a capture that failed or was skipped."""
    capture = capture_service.get_capture(db, current_user.id, capture_id)
    if not capture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Capture not found"
        )

    if capture.processing_status not in ProcessingStatus.RETRYABLE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Capture is '{capture.processing_status}'; only "
                f"{' or '.join(ProcessingStatus.RETRYABLE)} captures can be re-interpreted"
            ),
        )

    capture_service.reset_for_retry(db, capture)
    background_tasks.add_task(capture_service.run_interpretation, capture.id)
    return capture


@router.delete("/{capture_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_capture(
    capture_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    capture = capture_service.get_capture(db, current_user.id, capture_id)
    if not capture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Capture not found"
        )
    capture_service.delete_capture(db, capture)
    return None
