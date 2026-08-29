from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.auth import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.branch import (
    AttachRequest,
    BranchCreate,
    BranchDetail,
    BranchResponse,
    BranchStatusLiteral,
    BranchUpdate,
)
from app.services import branches as branch_service

router = APIRouter()


def _load(db: Session, user: User, branch_id: int):
    branch = branch_service.get_branch(db, user.id, branch_id)
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found"
        )
    return branch


@router.get("", response_model=List[BranchResponse])
async def get_branches(
    status_filter: Optional[BranchStatusLiteral] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Branches, most recently touched first."""
    return branch_service.list_branches(db, current_user.id, status_filter)


@router.post("", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
async def create_branch(
    data: BranchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a branch. Only a title is required."""
    try:
        return branch_service.create_branch(
            db, current_user.id, data.title, data.summary, data.project_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("/{branch_id}", response_model=BranchDetail)
async def get_branch(
    branch_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """A branch with its leaves, captures, tasks and entries."""
    return _load(db, current_user, branch_id)


@router.patch("/{branch_id}", response_model=BranchResponse)
async def update_branch(
    branch_id: int,
    data: BranchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    branch = _load(db, current_user, branch_id)
    try:
        return branch_service.update_branch(db, branch, **data.model_dump(exclude_unset=True))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/{branch_id}/attach", status_code=status.HTTP_204_NO_CONTENT)
async def attach(
    branch_id: int,
    request: AttachRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Attach a leaf, capture, task or entry to a branch.

    Idempotent. Attaching something already attached returns 204 rather than
    an error -- the user wanted it attached, and it is.
    """
    branch = _load(db, current_user, branch_id)
    try:
        branch_service.attach(db, branch, request.kind, request.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return None


@router.post("/{branch_id}/detach", status_code=status.HTTP_204_NO_CONTENT)
async def detach(
    branch_id: int,
    request: AttachRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a link. The thing itself is untouched."""
    branch = _load(db, current_user, branch_id)
    try:
        branch_service.detach(db, branch, request.kind, request.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return None


@router.delete("/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_branch(
    branch_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a branch and its links. Nothing it linked to is deleted."""
    branch_service.delete_branch(db, _load(db, current_user, branch_id))
    return None
