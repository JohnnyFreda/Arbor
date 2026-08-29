"""Branches and what hangs off them.

The invariants worth pinning down are ownership, idempotent attaching, and
that a branch never owns the things it links to — deleting one must not take
the user's captures with it. See ADR-009.
"""

from datetime import date, datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.db.models.branch import Branch
from app.db.models.capture import Capture, ProcessingStatus
from app.db.models.entry import Entry
from app.db.models.leaf import Leaf
from app.db.models.project import Project
from app.db.models.task import Task
from app.main import app

client = TestClient(app)


@pytest.fixture
def owner(make_user, db):
    user, password = make_user()
    token = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": password}
    ).json()["access_token"]
    return {"user": user, "headers": {"Authorization": f"Bearer {token}"}}


def _branch(headers, title="GA F201 refactor", **extra):
    response = client.post(
        "/api/v1/branches", json={"title": title, **extra}, headers=headers
    )
    assert response.status_code == 201, response.text
    return response.json()


def _capture(db, user_id, text="a thought"):
    row = Capture(
        user_id=user_id, content=text, source="desktop",
        processing_status=ProcessingStatus.SKIPPED,
    )
    db.add(row); db.commit(); db.refresh(row)
    return row


def _leaf(db, user_id, **overrides):
    fields = dict(
        user_id=user_id, source="slack", source_id="C123.1699",
        type="message", title="Anthony on the refactor",
        content="we should split the F201 handler first",
        author="anthony", url="https://slack.com/archives/C123/p1699",
        occurred_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    fields.update(overrides)
    row = Leaf(**fields)
    db.add(row); db.commit(); db.refresh(row)
    return row


def _attach(headers, branch_id, kind, item_id):
    return client.post(
        f"/api/v1/branches/{branch_id}/attach",
        json={"kind": kind, "id": item_id}, headers=headers,
    )


# --- creating ------------------------------------------------------------


def test_a_branch_needs_only_a_title(owner):
    """A branch may predate knowing which project it belongs to."""
    branch = _branch(owner["headers"])
    assert branch["title"] == "GA F201 refactor"
    assert branch["project_id"] is None
    assert branch["status"] == "open"


def test_a_branch_can_belong_to_a_project(owner, db):
    project = Project(user_id=owner["user"].id, name="Tourify")
    db.add(project); db.commit(); db.refresh(project)
    branch = _branch(owner["headers"], project_id=project.id)
    assert branch["project_id"] == project.id


def test_another_users_project_is_rejected(owner, make_user, db):
    other, _ = make_user()
    theirs = Project(user_id=other.id, name="Not yours")
    db.add(theirs); db.commit(); db.refresh(theirs)
    response = client.post(
        "/api/v1/branches",
        json={"title": "x", "project_id": theirs.id},
        headers=owner["headers"],
    )
    assert response.status_code == 404


# --- attaching -----------------------------------------------------------


def test_attaching_a_leaf_and_a_capture(owner, db):
    branch = _branch(owner["headers"])
    leaf = _leaf(db, owner["user"].id)
    capture = _capture(db, owner["user"].id, "the F201 handler is doing too much")

    assert _attach(owner["headers"], branch["id"], "leaf", leaf.id).status_code == 204
    assert _attach(owner["headers"], branch["id"], "capture", capture.id).status_code == 204

    detail = client.get(f"/api/v1/branches/{branch['id']}", headers=owner["headers"]).json()
    assert [l["id"] for l in detail["leaves"]] == [leaf.id]
    assert [c["id"] for c in detail["captures"]] == [capture.id]
    # The link back to the source survives the round trip.
    assert detail["leaves"][0]["url"].startswith("https://slack.com/")


def test_attaching_twice_is_not_an_error_and_does_not_duplicate(owner, db):
    """A second click means the user wants it attached, and it is."""
    branch = _branch(owner["headers"])
    leaf = _leaf(db, owner["user"].id)

    assert _attach(owner["headers"], branch["id"], "leaf", leaf.id).status_code == 204
    assert _attach(owner["headers"], branch["id"], "leaf", leaf.id).status_code == 204

    detail = client.get(f"/api/v1/branches/{branch['id']}", headers=owner["headers"]).json()
    assert len(detail["leaves"]) == 1


def test_one_leaf_can_hang_off_two_branches(owner, db):
    """The same Slack thread can inform two lines of work."""
    first = _branch(owner["headers"], "GA F201 refactor")
    second = _branch(owner["headers"], "Auth cleanup")
    leaf = _leaf(db, owner["user"].id)

    _attach(owner["headers"], first["id"], "leaf", leaf.id)
    _attach(owner["headers"], second["id"], "leaf", leaf.id)

    for b in (first, second):
        detail = client.get(f"/api/v1/branches/{b['id']}", headers=owner["headers"]).json()
        assert len(detail["leaves"]) == 1


def test_tasks_and_entries_attach_too(owner, db):
    branch = _branch(owner["headers"])
    task = Task(user_id=owner["user"].id, title="Split the handler", type="task", status="open")
    entry = Entry(user_id=owner["user"].id, date=date.today(), title="Today", mood=4)
    db.add_all([task, entry]); db.commit(); db.refresh(task); db.refresh(entry)

    assert _attach(owner["headers"], branch["id"], "task", task.id).status_code == 204
    assert _attach(owner["headers"], branch["id"], "entry", entry.id).status_code == 204

    detail = client.get(f"/api/v1/branches/{branch['id']}", headers=owner["headers"]).json()
    assert [t["id"] for t in detail["tasks"]] == [task.id]
    assert [e["id"] for e in detail["entries"]] == [entry.id]


def test_cannot_attach_another_users_row(owner, make_user, db):
    """An id is just a number; ownership is checked, not trusted."""
    branch = _branch(owner["headers"])
    other, _ = make_user()
    theirs = _capture(db, other.id, "someone else's thought")

    assert _attach(owner["headers"], branch["id"], "capture", theirs.id).status_code == 404

    detail = client.get(f"/api/v1/branches/{branch['id']}", headers=owner["headers"]).json()
    assert detail["captures"] == []


def test_unknown_kind_is_rejected(owner):
    branch = _branch(owner["headers"])
    response = _attach(owner["headers"], branch["id"], "sandwich", 1)
    assert response.status_code == 422


# --- detaching, and what a branch does not own ---------------------------


def test_detaching_removes_the_link_not_the_capture(owner, db):
    """A branch is a view onto the user's records, not their owner."""
    branch = _branch(owner["headers"])
    capture = _capture(db, owner["user"].id)
    _attach(owner["headers"], branch["id"], "capture", capture.id)

    response = client.post(
        f"/api/v1/branches/{branch['id']}/detach",
        json={"kind": "capture", "id": capture.id}, headers=owner["headers"],
    )
    assert response.status_code == 204

    detail = client.get(f"/api/v1/branches/{branch['id']}", headers=owner["headers"]).json()
    assert detail["captures"] == []
    assert db.query(Capture).filter(Capture.id == capture.id).first() is not None


def test_deleting_a_branch_keeps_everything_it_linked_to(owner, db):
    """The clearest way to lose a user's data would be to get this wrong."""
    branch = _branch(owner["headers"])
    capture = _capture(db, owner["user"].id)
    leaf = _leaf(db, owner["user"].id)
    _attach(owner["headers"], branch["id"], "capture", capture.id)
    _attach(owner["headers"], branch["id"], "leaf", leaf.id)

    assert client.delete(
        f"/api/v1/branches/{branch['id']}", headers=owner["headers"]
    ).status_code == 204

    assert db.query(Branch).filter(Branch.id == branch["id"]).first() is None
    assert db.query(Capture).filter(Capture.id == capture.id).first() is not None
    assert db.query(Leaf).filter(Leaf.id == leaf.id).first() is not None


# --- updating and scoping ------------------------------------------------


def test_a_branch_can_be_resolved(owner):
    branch = _branch(owner["headers"])
    response = client.patch(
        f"/api/v1/branches/{branch['id']}",
        json={"status": "resolved"}, headers=owner["headers"],
    )
    assert response.status_code == 200
    assert response.json()["status"] == "resolved"
    assert [b["id"] for b in client.get(
        "/api/v1/branches", params={"status": "open"}, headers=owner["headers"]
    ).json()] == []


def test_branches_are_scoped_to_their_owner(owner, make_user):
    _branch(owner["headers"], "Private line of work")
    other, password = make_user()
    token = client.post(
        "/api/v1/auth/login", json={"email": other.email, "password": password}
    ).json()["access_token"]
    listed = client.get(
        "/api/v1/branches", headers={"Authorization": f"Bearer {token}"}
    ).json()
    assert all(b["title"] != "Private line of work" for b in listed)


def test_branch_endpoints_require_authentication():
    assert client.get("/api/v1/branches").status_code == 401
    assert client.post("/api/v1/branches", json={"title": "x"}).status_code == 401
