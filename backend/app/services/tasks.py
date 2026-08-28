"""Task reads and lifecycle updates."""

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models.project import Project
from app.db.models.task import Task, TaskStatus
from app.schemas.task import TaskUpdate


def list_tasks(
    db: Session,
    user_id: int,
    status: Optional[str] = None,
    type: Optional[str] = None,
    project_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Task]:
    """Open work first, then newest -- the dashboard reads the top of this."""
    query = db.query(Task).filter(Task.user_id == user_id)
    if status:
        query = query.filter(Task.status == status)
    if type:
        query = query.filter(Task.type == type)
    if project_id:
        query = query.filter(Task.project_id == project_id)
    return (
        query.order_by(Task.created_at.desc(), Task.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_task(db: Session, user_id: int, task_id: int) -> Optional[Task]:
    return (
        db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    )


def update_task(db: Session, task: Task, data: TaskUpdate) -> Task:
    if data.title is not None:
        task.title = data.title
    if data.notes is not None:
        task.notes = data.notes
    if data.priority is not None:
        task.priority = data.priority
    if data.due_date is not None:
        task.due_date = data.due_date

    if data.project_id is not None:
        if data.project_id == 0:
            task.project_id = None
        else:
            owned = (
                db.query(Project)
                .filter(Project.id == data.project_id, Project.user_id == task.user_id)
                .first()
            )
            if owned is None:
                raise ValueError("Project not found")
            task.project_id = data.project_id

    if data.status is not None:
        _set_status(task, data.status)

    db.commit()
    db.refresh(task)
    return task


def _set_status(task: Task, status: str) -> None:
    """Keep completed_at consistent with status rather than trusting the client."""
    if status == TaskStatus.DONE and task.status != TaskStatus.DONE:
        task.completed_at = datetime.now(timezone.utc)
    elif status != TaskStatus.DONE:
        # Reopening or dropping clears the completion stamp.
        task.completed_at = None
    task.status = status
