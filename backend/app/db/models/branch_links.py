"""What a branch is made of.

One join table per kind rather than a single polymorphic one. More tables, but
every link is a real foreign key the database enforces -- a polymorphic
(item_type, item_id) pair cannot be, and silently rots when a row is deleted.

Leaves normalize foreign evidence. Captures, tasks and entries are linked
where they already live, never copied: duplicating the user's own words gives
two records that can drift, against Principle 2. See ADR-009.
"""

from sqlalchemy import Column, Integer, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from app.db.base import Base


def _link(name: str, other_table: str, other_column: str) -> Table:
    """A branch-to-something join, with the composite key doing the deduping.

    The primary key across both columns is what makes attaching twice a no-op
    rather than a second row.
    """
    return Table(
        name,
        Base.metadata,
        Column("branch_id", Integer, ForeignKey("branches.id"), primary_key=True),
        Column(other_column, Integer, ForeignKey(f"{other_table}.id"), primary_key=True),
        Column("created_at", DateTime(timezone=True), server_default=func.now()),
    )


branch_leaves = _link("branch_leaves", "leaves", "leaf_id")
branch_captures = _link("branch_captures", "captures", "capture_id")
branch_tasks = _link("branch_tasks", "tasks", "task_id")
branch_entries = _link("branch_entries", "entries", "entry_id")
