from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class TaskType:
    """Actionable interpretation types. See ADR-006."""

    TASK = "task"
    BLOCKER = "blocker"

    ALL = (TASK, BLOCKER)


class TaskStatus:
    OPEN = "open"
    DONE = "done"
    DROPPED = "dropped"

    ALL = (OPEN, DONE, DROPPED)


class Task(Base):
    """Actionable work accepted out of the inbox.

    Created only for the actionable interpretation types -- `task` and
    `blocker`. Accepting a thought, idea, or note creates nothing: those have
    no lifecycle, and the Capture plus its accepted Interpretation already is
    the note. See ADR-006.

    Deliberately not a task manager. No subtasks, dependencies, recurrence,
    assignees, or external-system mapping; widening that needs a new ADR.

    Distinct from Entry for the same reason Capture is: entries are dated
    reflection with a required mood and feed the streak, calendar, and mood
    averages.
    """

    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    type = Column(String, nullable=False, default=TaskType.TASK)
    title = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String, nullable=False, default=TaskStatus.OPEN, index=True)
    priority = Column(String, nullable=True)
    # Never inferred by a model -- the Process Inbox skill is told not to
    # invent deadlines. See docs/architecture/agents-and-skills.md.
    due_date = Column(Date, nullable=True)

    # Provenance. Both nullable: a task may be structured by hand after the
    # proposal was dismissed, or originate somewhere with no capture at all.
    # source_capture_id is the durable link and survives re-interpretation;
    # source_interpretation_id records which proposal was actually accepted.
    source_capture_id = Column(
        Integer, ForeignKey("captures.id"), nullable=True, index=True
    )
    source_interpretation_id = Column(
        Integer, ForeignKey("interpretations.id"), nullable=True, index=True
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", backref="tasks")
    project = relationship("Project")
    source_capture = relationship("Capture")
    source_interpretation = relationship("Interpretation")
