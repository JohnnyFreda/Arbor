from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, Literal


TaskTypeLiteral = Literal["task", "blocker"]
TaskStatusLiteral = Literal["open", "done", "dropped"]


class TaskUpdate(BaseModel):
    """Fields a user may change on an accepted task.

    `type` is not editable here: whether something is a task or a blocker came
    from the interpretation, and changing it should go back through the inbox.
    """

    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=10000)
    status: Optional[TaskStatusLiteral] = None
    priority: Optional[str] = Field(default=None, max_length=32)
    due_date: Optional[date] = None
    project_id: Optional[int] = None


class TaskResponse(BaseModel):
    id: int
    user_id: int
    project_id: Optional[int] = None
    type: TaskTypeLiteral
    title: str
    notes: Optional[str] = None
    status: TaskStatusLiteral
    priority: Optional[str] = None
    due_date: Optional[date] = None
    source_capture_id: Optional[int] = None
    source_interpretation_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
