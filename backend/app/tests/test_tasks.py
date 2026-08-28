"""Inbox accept flow and task lifecycle.

Covers the invariants ADR-006 commits to: actionable types produce exactly one
task, non-actionable types produce none, and accepting stays reversible.
"""

import pytest
from fastapi.testclient import TestClient

from app.db.models.task import Task, TaskStatus
from app.main import app
from app.schemas.capture import ProposedInterpretation
from app.services import interpretation as interpretation_service

client = TestClient(app)


class _StubInterpreter:
    name = "stub-interpreter"

    def __init__(self, proposal):
        self._proposal = proposal

    def interpret(self, content):
        return self._proposal


@pytest.fixture
def propose(monkeypatch):
    """Capture something and get back its interpretation, shaped as asked."""

    def _propose(auth_headers, content="a thought worth structuring", **fields):
        fields.setdefault("type", "task")
        fields.setdefault("suggested_title", "Fix the refresh token rotation")
        monkeypatch.setattr(
            interpretation_service,
            "get_interpreter",
            lambda: _StubInterpreter(ProposedInterpretation(**fields)),
        )
        created = client.post(
            "/api/v1/captures", json={"content": content}, headers=auth_headers
        )
        assert created.status_code == 201, created.text
        capture = client.get(
            f"/api/v1/captures/{created.json()['id']}", headers=auth_headers
        ).json()
        assert capture["interpretation"] is not None, "interpreter did not run"
        return capture

    return _propose


def _tasks(auth_headers, **params):
    response = client.get("/api/v1/tasks", params=params, headers=auth_headers)
    assert response.status_code == 200, response.text
    return response.json()


def _decide(auth_headers, interpretation_id, **payload):
    return client.patch(
        f"/api/v1/interpretations/{interpretation_id}",
        json=payload,
        headers=auth_headers,
    )


# --- actionable types produce a task -------------------------------------


@pytest.mark.parametrize("actionable_type", ["task", "blocker"])
def test_accepting_actionable_type_creates_a_task(
    auth_headers, propose, actionable_type
):
    capture = propose(auth_headers, type=actionable_type, suggested_title="Ship it")
    response = _decide(auth_headers, capture["interpretation"]["id"], status="accepted")
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "accepted"

    tasks = _tasks(auth_headers, type=actionable_type)
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Ship it"
    assert tasks[0]["type"] == actionable_type
    assert tasks[0]["status"] == "open"


def test_task_records_provenance_back_to_the_capture(auth_headers, propose):
    capture = propose(auth_headers, content="the auth thing again")
    interpretation_id = capture["interpretation"]["id"]
    _decide(auth_headers, interpretation_id, status="accepted")

    task = _tasks(auth_headers)[0]
    assert task["source_capture_id"] == capture["id"]
    assert task["source_interpretation_id"] == interpretation_id


def test_task_falls_back_to_capture_text_when_no_title_proposed(
    auth_headers, propose
):
    capture = propose(
        auth_headers, content="  look into   the flaky   calendar test  ",
        suggested_title=None,
    )
    _decide(auth_headers, capture["interpretation"]["id"], status="accepted")
    assert _tasks(auth_headers)[0]["title"] == "look into the flaky calendar test"


def test_long_capture_title_is_truncated(auth_headers, propose):
    long_text = "remember that " + "very " * 60 + "long thought"
    capture = propose(auth_headers, content=long_text, suggested_title=None)
    _decide(auth_headers, capture["interpretation"]["id"], status="accepted")
    title = _tasks(auth_headers)[0]["title"]
    assert len(title) <= 80
    assert title.endswith("…")


# --- non-actionable types produce nothing --------------------------------


@pytest.mark.parametrize("quiet_type", ["thought", "idea", "note"])
def test_accepting_non_actionable_type_creates_no_task(
    auth_headers, propose, quiet_type
):
    """ADR-006: a note has no lifecycle, so it gets no lifecycle record."""
    capture = propose(auth_headers, type=quiet_type)
    response = _decide(auth_headers, capture["interpretation"]["id"], status="accepted")
    assert response.status_code == 200
    assert response.json()["status"] == "accepted"
    assert _tasks(auth_headers) == []


# --- accepting is idempotent and reversible ------------------------------


def test_accepting_twice_does_not_create_two_tasks(auth_headers, propose):
    capture = propose(auth_headers)
    interpretation_id = capture["interpretation"]["id"]

    _decide(auth_headers, interpretation_id, status="accepted")
    _decide(auth_headers, interpretation_id, status="accepted")

    assert len(_tasks(auth_headers)) == 1


def test_dismissing_after_accepting_withdraws_the_task(auth_headers, propose):
    capture = propose(auth_headers)
    interpretation_id = capture["interpretation"]["id"]

    _decide(auth_headers, interpretation_id, status="accepted")
    response = _decide(auth_headers, interpretation_id, status="dismissed")
    assert response.status_code == 200
    assert response.json()["status"] == "dismissed"

    assert _tasks(auth_headers, status="open") == []
    assert len(_tasks(auth_headers, status="dropped")) == 1


def test_dismissing_does_not_erase_completed_work(auth_headers, propose):
    """Finished work survives a change of mind about the suggestion."""
    capture = propose(auth_headers)
    interpretation_id = capture["interpretation"]["id"]
    _decide(auth_headers, interpretation_id, status="accepted")

    task_id = _tasks(auth_headers)[0]["id"]
    client.patch(
        f"/api/v1/tasks/{task_id}", json={"status": "done"}, headers=auth_headers
    )

    _decide(auth_headers, interpretation_id, status="dismissed")
    assert client.get(
        f"/api/v1/tasks/{task_id}", headers=auth_headers
    ).json()["status"] == "done"


def test_re_accepting_revives_a_withdrawn_task(auth_headers, propose):
    capture = propose(auth_headers)
    interpretation_id = capture["interpretation"]["id"]

    _decide(auth_headers, interpretation_id, status="accepted")
    _decide(auth_headers, interpretation_id, status="dismissed")
    _decide(auth_headers, interpretation_id, status="accepted")

    open_tasks = _tasks(auth_headers, status="open")
    assert len(open_tasks) == 1
    assert len(_tasks(auth_headers)) == 1


def test_dismissing_without_accepting_creates_nothing(auth_headers, propose):
    capture = propose(auth_headers)
    _decide(auth_headers, capture["interpretation"]["id"], status="dismissed")
    assert _tasks(auth_headers) == []


# --- editing --------------------------------------------------------------


def test_edit_overrides_the_model_proposal(auth_headers, propose):
    capture = propose(auth_headers, suggested_title="Model's guess")
    response = _decide(
        auth_headers,
        capture["interpretation"]["id"],
        status="edited",
        suggested_title="What I actually meant",
    )
    assert response.status_code == 200
    assert response.json()["suggested_title"] == "What I actually meant"
    assert _tasks(auth_headers)[0]["title"] == "What I actually meant"


def test_editing_a_note_into_a_task_creates_one(auth_headers, propose):
    capture = propose(auth_headers, type="note")
    _decide(
        auth_headers, capture["interpretation"]["id"], status="edited", type="task"
    )
    assert len(_tasks(auth_headers)) == 1


def test_editing_a_task_down_to_a_note_withdraws_its_task(auth_headers, propose):
    capture = propose(auth_headers, type="task")
    interpretation_id = capture["interpretation"]["id"]
    _decide(auth_headers, interpretation_id, status="accepted")
    assert len(_tasks(auth_headers, status="open")) == 1

    _decide(auth_headers, interpretation_id, status="edited", type="note")
    assert _tasks(auth_headers, status="open") == []


def test_edits_require_the_edited_status(auth_headers, propose):
    capture = propose(auth_headers)
    response = _decide(
        auth_headers,
        capture["interpretation"]["id"],
        status="accepted",
        suggested_title="sneaking an edit through accept",
    )
    assert response.status_code == 422


def test_edit_cannot_attach_another_users_project(auth_headers, propose, make_user, db):
    from app.db.models.project import Project

    other_user, _ = make_user()
    other_project = Project(user_id=other_user.id, name="Not yours")
    db.add(other_project)
    db.commit()
    db.refresh(other_project)

    capture = propose(auth_headers)
    response = _decide(
        auth_headers,
        capture["interpretation"]["id"],
        status="edited",
        suggested_project_id=other_project.id,
    )
    assert response.status_code == 404


# --- task lifecycle -------------------------------------------------------


def test_completing_a_task_stamps_completed_at(auth_headers, propose):
    capture = propose(auth_headers)
    _decide(auth_headers, capture["interpretation"]["id"], status="accepted")
    task_id = _tasks(auth_headers)[0]["id"]

    done = client.patch(
        f"/api/v1/tasks/{task_id}", json={"status": "done"}, headers=auth_headers
    ).json()
    assert done["status"] == "done"
    assert done["completed_at"] is not None

    reopened = client.patch(
        f"/api/v1/tasks/{task_id}", json={"status": "open"}, headers=auth_headers
    ).json()
    assert reopened["completed_at"] is None


def test_blockers_are_queryable_for_the_today_view(auth_headers, propose):
    """user-flows.md requires the Today view to surface blockers."""
    blocker = propose(auth_headers, type="blocker", suggested_title="Staging creds")
    _decide(auth_headers, blocker["interpretation"]["id"], status="accepted")
    plain = propose(auth_headers, type="task", suggested_title="Ordinary work")
    _decide(auth_headers, plain["interpretation"]["id"], status="accepted")

    blockers = _tasks(auth_headers, type="blocker", status="open")
    assert len(blockers) == 1
    assert blockers[0]["title"] == "Staging creds"


# --- scoping --------------------------------------------------------------


def test_other_user_cannot_decide_your_interpretation(
    auth_headers, propose, make_user, db
):
    capture = propose(auth_headers)
    other_user, password = make_user()
    token = client.post(
        "/api/v1/auth/login", json={"email": other_user.email, "password": password}
    ).json()["access_token"]

    response = client.patch(
        f"/api/v1/interpretations/{capture['interpretation']['id']}",
        json={"status": "accepted"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404
    assert db.query(Task).filter(Task.user_id == other_user.id).count() == 0


def test_tasks_are_scoped_to_their_owner(auth_headers, propose, make_user):
    capture = propose(auth_headers, suggested_title="Private work")
    _decide(auth_headers, capture["interpretation"]["id"], status="accepted")

    other_user, password = make_user()
    token = client.post(
        "/api/v1/auth/login", json={"email": other_user.email, "password": password}
    ).json()["access_token"]

    assert _tasks({"Authorization": f"Bearer {token}"}) == []


def test_task_endpoints_require_authentication():
    assert client.get("/api/v1/tasks").status_code == 401
    assert client.patch("/api/v1/interpretations/1", json={"status": "accepted"}).status_code == 401
