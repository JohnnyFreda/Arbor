from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class BranchStatus:
    OPEN = "open"
    RESOLVED = "resolved"
    DROPPED = "dropped"

    ALL = (OPEN, RESOLVED, DROPPED)


class Branch(Base):
    """A line of work. "GA F201 refactor", not "Tourify".

    Projects are where work lives; a branch is what the work is about. A
    refactor running three weeks across two repositories, argued out in Slack
    before anyone opened an editor, has nowhere else to live. See ADR-009.

    Note the name: this is Arbor's entity. A git branch is called a ref
    everywhere in this codebase, following GitHub's own API.
    """

    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # Nullable on purpose: a branch may span two projects, or start before it
    # is clear where it belongs. Demanding one up front is the friction ADR-001
    # rejected at capture time, one level up.
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    status = Column(String, nullable=False, default=BranchStatus.OPEN, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="branches")
    project = relationship("Project")

    # Foreign evidence is normalized into leaves. Native rows are linked, not
    # copied -- the raw capture stays the single record of the user's words.
    leaves = relationship(
        "Leaf", secondary="branch_leaves", back_populates="branches"
    )
    captures = relationship("Capture", secondary="branch_captures")
    tasks = relationship("Task", secondary="branch_tasks")
    entries = relationship("Entry", secondary="branch_entries")
