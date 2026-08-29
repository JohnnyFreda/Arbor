from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class LeafSource:
    """Where a leaf came from. Foreign systems only.

    Captures, tasks and diary entries are not sources: they are already in
    Arbor's shape and are linked to a branch directly rather than copied into
    a leaf. See ADR-009.
    """

    GITHUB = "github"
    SLACK = "slack"
    CLICKUP = "clickup"
    MEETING = "meeting"
    WEB = "web"

    ALL = (GITHUB, SLACK, CLICKUP, MEETING, WEB)


class LeafType:
    COMMIT = "commit"
    PULL_REQUEST = "pull_request"
    ISSUE = "issue"
    MESSAGE = "message"
    TASK = "task"
    DECISION = "decision"
    NOTE = "note"

    ALL = (COMMIT, PULL_REQUEST, ISSUE, MESSAGE, TASK, DECISION, NOTE)


class Leaf(Base):
    """A normalized piece of evidence from a foreign system.

    What ADR-002 and the architecture documents call a Context Item, renamed
    for the model. Those documents keep the old word: they record what was
    decided when, and rewriting them would invent a history where it was
    always called a Leaf.

    Retrieved external text is untrusted content. A leaf is evidence, never
    instruction -- nothing in it may widen what an agent is allowed to do.
    See docs/architecture/permissions.md.
    """

    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    source = Column(String, nullable=False, index=True)
    # The identifier the source system uses. Paired with `source` it is what
    # makes syncing idempotent: seeing the same pull request twice must not
    # grow a second leaf.
    source_id = Column(String, nullable=False)
    type = Column(String, nullable=False)

    title = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    author = Column(String, nullable=True)
    # The link back to the source. No entity of its own: one leaf, one source.
    url = Column(String, nullable=True)

    # When it happened in its own system, which is not when Arbor learned of
    # it. A pull request opened last week is last week's evidence.
    occurred_at = Column(DateTime(timezone=True), nullable=True, index=True)
    metadata_json = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="leaves")
    branches = relationship("Branch", secondary="branch_leaves", back_populates="leaves")
