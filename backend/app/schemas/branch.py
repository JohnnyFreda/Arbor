from pydantic import BaseModel, Field
from datetime import date as date_type, datetime
from typing import List, Literal, Optional


BranchStatusLiteral = Literal["open", "resolved", "dropped"]
AttachmentKind = Literal["leaf", "capture", "task", "entry"]

LeafSourceLiteral = Literal["github", "slack", "clickup", "meeting", "web"]
LeafTypeLiteral = Literal[
    "commit", "pull_request", "issue", "message", "task", "decision", "note"
]


class BranchCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    summary: Optional[str] = Field(default=None, max_length=10000)
    # Optional: a branch may span projects or predate knowing which one.
    project_id: Optional[int] = None


class BranchUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    summary: Optional[str] = Field(default=None, max_length=10000)
    status: Optional[BranchStatusLiteral] = None
    #: 0 clears the association.
    project_id: Optional[int] = None


class AttachRequest(BaseModel):
    kind: AttachmentKind
    id: int


class LeafResponse(BaseModel):
    id: int
    source: LeafSourceLiteral
    source_id: str
    type: LeafTypeLiteral
    title: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    #: The link back to the source system.
    url: Optional[str] = None
    occurred_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BranchResponse(BaseModel):
    id: int
    user_id: int
    project_id: Optional[int] = None
    title: str
    summary: Optional[str] = None
    status: BranchStatusLiteral
    created_at: datetime
    updated_at: datetime
    #: When evidence last arrived, which is what branches are ordered by.
    last_activity_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AttachedCapture(BaseModel):
    id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class AttachedTask(BaseModel):
    id: int
    title: str
    type: str
    status: str

    class Config:
        from_attributes = True


class AttachedEntry(BaseModel):
    id: int
    date: date_type
    title: Optional[str] = None

    class Config:
        from_attributes = True


class BranchDetail(BranchResponse):
    """A branch with everything hanging off it.

    Leaves and native rows are returned separately rather than flattened into
    one list: they are different things, and collapsing them would lose which
    are the user's own words and which are evidence from elsewhere.
    """

    leaves: List[LeafResponse] = []
    captures: List[AttachedCapture] = []
    tasks: List[AttachedTask] = []
    entries: List[AttachedEntry] = []
