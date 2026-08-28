from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.auth import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.task import TaskResponse, TaskStatusLiteral, TaskTypeLiteral, TaskUpdate
from app.services import tasks as task_service

router = APIRouter()


@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    status_filter: Optional[TaskStatusLiteral] = Query(None, alias="status"),
    type: Optional[TaskTypeLiteral] = Query(None),
    project_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List tasks. The Today view reads blockers as ?type=blocker&status=open."""
    return task_service.list_tasks(
        db=db,
        user_id=current_user.id,
        status=status_filter,
        type=type,
        project_id=project_id,
        limit=limit,
        offset=offset,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = task_service.get_task(db, current_user.id, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a task. Setting status to 'dropped' is the soft delete."""
    task = task_service.get_task(db, current_user.id, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    try:
        return task_service.update_task(db, task, task_data)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
