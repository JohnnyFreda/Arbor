from sqlalchemy import Boolean, Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy import true as sa_true
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class InterpretationType:
    """How a capture was classified. See docs/roadmap/mvp.md."""

    THOUGHT = "thought"
    TASK = "task"
    IDEA = "idea"
    NOTE = "note"
    BLOCKER = "blocker"

    ALL = (THOUGHT, TASK, IDEA, NOTE, BLOCKER)


class InterpretationStatus:
    """The user's decision about a proposal.

    Separate from Capture.processing_status, which tracks whether the model ran.
    """

    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    EDITED = "edited"
    DISMISSED = "dismissed"

    ALL = (PROPOSED, ACCEPTED, EDITED, DISMISSED)


class Interpretation(Base):
    """AI-proposed structure for a Capture.

    A proposal, not authoritative state: reviewable, reversible, and stored
    apart from the raw capture so the original input is never overwritten.
    See ADR-002 and Principle 3.
    """

    __tablename__ = "interpretations"

    id = Column(Integer, primary_key=True, index=True)
    capture_id = Column(
        Integer, ForeignKey("captures.id"), nullable=False, index=True
    )
    type = Column(String, nullable=False)
    suggested_title = Column(String, nullable=True)
    suggested_project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    suggested_priority = Column(String, nullable=True)
    suggested_next_action = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(String, nullable=False, default=InterpretationStatus.PROPOSED)
    # Which model produced this, for provenance when proposals are wrong.
    model = Column(String, nullable=True)
    # Whether `confidence` above means anything. Small local models emit ~0.9
    # for everything, including answers they got wrong, so the value is stored
    # but withheld from the API until a provider earns it. See ADR-008.
    confidence_is_calibrated = Column(
        Boolean, nullable=False, default=True, server_default=sa_true()
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    capture = relationship("Capture", back_populates="interpretations")
    suggested_project = relationship("Project")
