from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class CaptureSource:
    """Where a capture came from. See docs/architecture/data-model.md."""

    DESKTOP = "desktop"
    MOBILE = "mobile"
    VOICE = "voice"
    OTHER = "other"

    ALL = (DESKTOP, MOBILE, VOICE, OTHER)


class ProcessingStatus:
    """Pipeline state of AI interpretation for a capture.

    This tracks whether the model ran, not what the user decided about the
    result -- that lives on Interpretation.status. Keeping them apart is what
    makes "interpretation failed" distinguishable from "user dismissed it".
    """

    PENDING = "pending"        # stored, not yet interpreted
    PROCESSING = "processing"  # interpretation in flight
    INTERPRETED = "interpreted"
    FAILED = "failed"          # interpretation errored; capture is intact
    SKIPPED = "skipped"        # no interpreter configured

    ALL = (PENDING, PROCESSING, INTERPRETED, FAILED, SKIPPED)
    RETRYABLE = (FAILED, SKIPPED)


class Capture(Base):
    """Raw, unstructured input from the user.

    A Capture is source material: it is stored before any AI runs and its
    content is never rewritten by the system. Structure proposed on top of it
    lives in Interpretation. See ADR-001 and ADR-002.

    Distinct from Entry. Entries are dated diary reflection with a required
    mood; captures are undated, many-per-day, and require nothing but text.
    """

    __tablename__ = "captures"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    source = Column(String, nullable=False, default=CaptureSource.DESKTOP)
    processing_status = Column(
        String, nullable=False, default=ProcessingStatus.PENDING, index=True
    )
    # Client-supplied idempotency key. Dictation over bad mobile signal gets
    # retried; without this a retry becomes a second capture.
    client_token = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "client_token", name="unique_user_client_token"),
    )

    # Relationships
    user = relationship("User", backref="captures")
    interpretations = relationship(
        "Interpretation",
        back_populates="capture",
        cascade="all, delete-orphan",
        order_by="Interpretation.created_at",
    )

    @property
    def interpretation(self):
        """The current proposal, if any. One per capture until re-interpretation."""
        return self.interpretations[-1] if self.interpretations else None
