"""Branches, and attaching things to them.

ADR-009 named attaching as the thing that decides whether branches are worth
having: a branch nobody feeds is an empty branch. So attaching is idempotent,
takes one call, and never fails for the boring reason that something was
already attached.
"""

from typing import List, Optional

from sqlalchemy import delete, insert, select
from sqlalchemy.orm import Session

from app.db.models.branch import Branch, BranchStatus
from app.db.models.branch_links import (
    branch_captures,
    branch_entries,
    branch_leaves,
    branch_tasks,
)
from app.db.models.capture import Capture
from app.db.models.entry import Entry
from app.db.models.leaf import Leaf
from app.db.models.project import Project
from app.db.models.task import Task

#: What can hang off a branch, and the table and column that links it.
#: Adding a kind here is the whole change -- callers stay generic.
ATTACHABLE = {
    "leaf": (branch_leaves, "leaf_id", Leaf),
    "capture": (branch_captures, "capture_id", Capture),
    "task": (branch_tasks, "task_id", Task),
    "entry": (branch_entries, "entry_id", Entry),
}


def list_branches(
    db: Session, user_id: int, status: Optional[str] = None
) -> List[Branch]:
    query = db.query(Branch).filter(Branch.user_id == user_id)
    if status:
        query = query.filter(Branch.status == status)
    return query.order_by(Branch.updated_at.desc(), Branch.id.desc()).all()


def get_branch(db: Session, user_id: int, branch_id: int) -> Optional[Branch]:
    return (
        db.query(Branch)
        .filter(Branch.id == branch_id, Branch.user_id == user_id)
        .first()
    )


def create_branch(
    db: Session,
    user_id: int,
    title: str,
    summary: Optional[str] = None,
    project_id: Optional[int] = None,
) -> Branch:
    if project_id:
        _assert_owned(db, Project, project_id, user_id, "Project not found")

    branch = Branch(
        user_id=user_id,
        title=title,
        summary=summary,
        project_id=project_id,
        status=BranchStatus.OPEN,
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch


def update_branch(db: Session, branch: Branch, **fields) -> Branch:
    if fields.get("project_id") is not None:
        # 0 clears the association, as it does for entries and tasks.
        if fields["project_id"] == 0:
            fields["project_id"] = None
        else:
            _assert_owned(
                db, Project, fields["project_id"], branch.user_id, "Project not found"
            )

    for key, value in fields.items():
        if value is not None or key == "project_id":
            setattr(branch, key, value)

    db.commit()
    db.refresh(branch)
    return branch


def attach(db: Session, branch: Branch, kind: str, item_id: int) -> bool:
    """Attach something to a branch. Returns True if it was newly attached.

    Idempotent: attaching twice is not an error and does not duplicate. The
    composite primary key would reject the second row anyway, but failing a
    user's second click is not useful behaviour -- they wanted it attached,
    and it is.
    """
    table, column, model = _kind(kind)
    _assert_owned(db, model, item_id, branch.user_id, f"{kind.title()} not found")

    already = db.execute(
        select(table).where(
            table.c.branch_id == branch.id, table.c[column] == item_id
        )
    ).first()
    if already:
        return False

    db.execute(insert(table).values(branch_id=branch.id, **{column: item_id}))
    db.commit()
    return True


def detach(db: Session, branch: Branch, kind: str, item_id: int) -> bool:
    """Remove a link. Returns True if there was one to remove.

    Only the link goes. Detaching a capture from a branch must never delete
    the capture -- the branch is a view onto the user's records, not their
    owner.
    """
    table, column, _ = _kind(kind)
    result = db.execute(
        delete(table).where(
            table.c.branch_id == branch.id, table.c[column] == item_id
        )
    )
    db.commit()
    return result.rowcount > 0


def delete_branch(db: Session, branch: Branch) -> None:
    """Delete a branch and its links, never the things it linked to."""
    for table, _, _ in ATTACHABLE.values():
        db.execute(delete(table).where(table.c.branch_id == branch.id))
    db.delete(branch)
    db.commit()


def _kind(kind: str):
    try:
        return ATTACHABLE[kind]
    except KeyError:
        raise ValueError(
            f"Unknown attachment kind '{kind}'. Expected one of: "
            + ", ".join(sorted(ATTACHABLE))
        ) from None


def _assert_owned(db: Session, model, item_id: int, user_id: int, message: str) -> None:
    """Everything attached must belong to the same user as the branch.

    Checked here rather than trusted from the request: an id is just a number,
    and nothing else stops one account attaching another's rows.
    """
    owned = (
        db.query(model).filter(model.id == item_id, model.user_id == user_id).first()
    )
    if owned is None:
        raise ValueError(message)
