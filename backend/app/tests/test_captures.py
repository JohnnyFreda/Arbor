"""Capture tests.

Focused on the boundaries where trust breaks: the capture surviving a failed
interpretation, the original content staying untouched, duplicate submissions,
and per-user scoping. See docs/development/testing.md.
"""

import pytest
from fastapi.testclient import TestClient

from app.db.models.capture import Capture, ProcessingStatus
from app.main import app
from app.schemas.capture import ProposedInterpretation
from app.services import interpretation as interpretation_service

client = TestClient(app)


class _StubInterpreter:
    name = "stub-interpreter"

    def __init__(self, proposal=None, error=None):
        self._proposal = proposal
        self._error = error

    def interpret(self, content):
        if self._error:
            raise self._error
        return self._proposal


@pytest.fixture
def working_interpreter(monkeypatch):
    proposal = ProposedInterpretation(
        type="task",
        suggested_title="Fix refresh token rotation",
        suggested_next_action="Reproduce the overnight logout",
        confidence=0.82,
    )
    monkeypatch.setattr(
        interpretation_service, "get_interpreter", lambda: _StubInterpreter(proposal)
    )
    return proposal


@pytest.fixture
def broken_interpreter(monkeypatch):
    monkeypatch.setattr(
        interpretation_service,
        "get_interpreter",
        lambda: _StubInterpreter(error=RuntimeError("model provider is down")),
    )


# --- capture persistence -------------------------------------------------


def test_capture_requires_only_content(auth_headers):
    """No project, type, priority, or date at capture time. ADR-001."""
    response = client.post(
        "/api/v1/captures",
        json={"content": "auth refresh feels broken after overnight idle"},
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["content"] == "auth refresh feels broken after overnight idle"
    assert body["source"] == "desktop"


def test_capture_preserves_content_verbatim(auth_headers):
    raw = "  ugh: the *token* rotation\n\n  ...still not right?  "
    response = client.post(
        "/api/v1/captures", json={"content": raw}, headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["content"] == raw


def test_blank_capture_is_rejected(auth_headers):
    response = client.post(
        "/api/v1/captures", json={"content": "   \n  "}, headers=auth_headers
    )
    assert response.status_code == 422


def test_capture_requires_authentication():
    response = client.post("/api/v1/captures", json={"content": "anonymous thought"})
    assert response.status_code == 401


# --- surviving AI failure ------------------------------------------------


def test_capture_survives_interpretation_failure(auth_headers, broken_interpreter, db):
    """The whole point: a model outage costs a proposal, never the thought."""
    response = client.post(
        "/api/v1/captures",
        json={"content": "idea: cache the project lookup"},
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    capture_id = response.json()["id"]

    stored = db.query(Capture).filter(Capture.id == capture_id).one()
    db.refresh(stored)
    assert stored.content == "idea: cache the project lookup"
    assert stored.processing_status == ProcessingStatus.FAILED

    # And it is still readable through the API.
    fetched = client.get(f"/api/v1/captures/{capture_id}", headers=auth_headers)
    assert fetched.status_code == 200
    assert fetched.json()["content"] == "idea: cache the project lookup"
    assert fetched.json()["interpretation"] is None


def test_no_interpreter_configured_marks_skipped(auth_headers, db):
    """Default state today: no provider wired up, capture still lands."""
    response = client.post(
        "/api/v1/captures", json={"content": "no model configured"}, headers=auth_headers
    )
    assert response.status_code == 201
    capture_id = response.json()["id"]

    stored = db.query(Capture).filter(Capture.id == capture_id).one()
    db.refresh(stored)
    assert stored.processing_status == ProcessingStatus.SKIPPED


def test_successful_interpretation_is_stored_separately(
    auth_headers, working_interpreter, db
):
    response = client.post(
        "/api/v1/captures",
        json={"content": "still logged out overnight, probably refresh tokens"},
        headers=auth_headers,
    )
    capture_id = response.json()["id"]

    stored = db.query(Capture).filter(Capture.id == capture_id).one()
    db.refresh(stored)
    assert stored.processing_status == ProcessingStatus.INTERPRETED
    # Raw content untouched by the interpretation.
    assert stored.content == "still logged out overnight, probably refresh tokens"

    fetched = client.get(f"/api/v1/captures/{capture_id}", headers=auth_headers).json()
    assert fetched["interpretation"]["type"] == "task"
    assert fetched["interpretation"]["status"] == "proposed"
    assert fetched["interpretation"]["model"] == "stub-interpreter"


def test_interpreter_cannot_link_another_users_project(
    auth_headers, make_user, monkeypatch, db
):
    """A hallucinated project id must not create a cross-account link."""
    from app.db.models.project import Project

    other_user, _ = make_user()
    other_project = Project(user_id=other_user.id, name="Someone else's project")
    db.add(other_project)
    db.commit()
    db.refresh(other_project)

    proposal = ProposedInterpretation(
        type="note", suggested_project_id=other_project.id, confidence=0.5
    )
    monkeypatch.setattr(
        interpretation_service, "get_interpreter", lambda: _StubInterpreter(proposal)
    )

    response = client.post(
        "/api/v1/captures", json={"content": "cross-account check"}, headers=auth_headers
    )
    capture_id = response.json()["id"]

    fetched = client.get(f"/api/v1/captures/{capture_id}", headers=auth_headers).json()
    assert fetched["interpretation"]["suggested_project_id"] is None


# --- duplicate submissions ----------------------------------------------


def test_repeated_client_token_does_not_duplicate(auth_headers, db):
    """A retried dictation over bad signal is one capture, not two."""
    payload = {"content": "voice note about the deploy", "client_token": "abc-123"}

    first = client.post("/api/v1/captures", json=payload, headers=auth_headers)
    assert first.status_code == 201

    second = client.post("/api/v1/captures", json=payload, headers=auth_headers)
    assert second.status_code == 200
    assert second.json()["id"] == first.json()["id"]

    count = (
        db.query(Capture)
        .filter(Capture.client_token == "abc-123", Capture.user_id == first.json()["user_id"])
        .count()
    )
    assert count == 1


def test_client_token_is_scoped_per_user(auth_headers, make_user):
    """The same token from a different account is a different capture."""
    payload = {"content": "shared token text", "client_token": "shared-token"}
    first = client.post("/api/v1/captures", json=payload, headers=auth_headers)
    assert first.status_code == 201

    other_user, password = make_user()
    token = client.post(
        "/api/v1/auth/login", json={"email": other_user.email, "password": password}
    ).json()["access_token"]

    second = client.post(
        "/api/v1/captures", json=payload, headers={"Authorization": f"Bearer {token}"}
    )
    assert second.status_code == 201
    assert second.json()["id"] != first.json()["id"]


def test_captures_without_token_are_never_deduplicated(auth_headers):
    payload = {"content": "the same thought twice, deliberately"}
    first = client.post("/api/v1/captures", json=payload, headers=auth_headers)
    second = client.post("/api/v1/captures", json=payload, headers=auth_headers)
    assert first.status_code == 201 and second.status_code == 201
    assert first.json()["id"] != second.json()["id"]


# --- listing, scoping, retry, delete -------------------------------------


def test_captures_are_scoped_to_their_owner(auth_headers, make_user):
    client.post(
        "/api/v1/captures", json={"content": "private thought"}, headers=auth_headers
    )

    other_user, password = make_user()
    token = client.post(
        "/api/v1/auth/login", json={"email": other_user.email, "password": password}
    ).json()["access_token"]
    other_headers = {"Authorization": f"Bearer {token}"}

    listed = client.get("/api/v1/captures", headers=other_headers).json()
    assert all(c["content"] != "private thought" for c in listed)


def test_other_user_cannot_read_capture_by_id(auth_headers, make_user):
    capture_id = client.post(
        "/api/v1/captures", json={"content": "not yours"}, headers=auth_headers
    ).json()["id"]

    other_user, password = make_user()
    token = client.post(
        "/api/v1/auth/login", json={"email": other_user.email, "password": password}
    ).json()["access_token"]

    response = client.get(
        f"/api/v1/captures/{capture_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404


def test_list_filters_by_processing_status(auth_headers, broken_interpreter):
    client.post(
        "/api/v1/captures", json={"content": "will fail"}, headers=auth_headers
    )
    response = client.get(
        "/api/v1/captures", params={"processing_status": "failed"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()
    assert all(c["processing_status"] == "failed" for c in response.json())


def test_retry_reinterprets_a_failed_capture(auth_headers, broken_interpreter, monkeypatch, db):
    capture_id = client.post(
        "/api/v1/captures", json={"content": "retry me"}, headers=auth_headers
    ).json()["id"]

    stored = db.query(Capture).filter(Capture.id == capture_id).one()
    db.refresh(stored)
    assert stored.processing_status == ProcessingStatus.FAILED

    # Provider comes back up.
    monkeypatch.setattr(
        interpretation_service,
        "get_interpreter",
        lambda: _StubInterpreter(ProposedInterpretation(type="idea", confidence=0.4)),
    )
    response = client.post(
        f"/api/v1/captures/{capture_id}/interpret", headers=auth_headers
    )
    assert response.status_code == 200

    db.refresh(stored)
    assert stored.processing_status == ProcessingStatus.INTERPRETED


def test_retry_rejected_for_already_interpreted_capture(
    auth_headers, working_interpreter
):
    capture_id = client.post(
        "/api/v1/captures", json={"content": "already done"}, headers=auth_headers
    ).json()["id"]

    response = client.post(
        f"/api/v1/captures/{capture_id}/interpret", headers=auth_headers
    )
    assert response.status_code == 409


def test_delete_capture_removes_its_interpretation(
    auth_headers, working_interpreter, db
):
    from app.db.models.interpretation import Interpretation

    capture_id = client.post(
        "/api/v1/captures", json={"content": "delete me"}, headers=auth_headers
    ).json()["id"]
    assert db.query(Interpretation).filter(
        Interpretation.capture_id == capture_id
    ).count() == 1

    response = client.delete(f"/api/v1/captures/{capture_id}", headers=auth_headers)
    assert response.status_code == 204

    assert client.get(
        f"/api/v1/captures/{capture_id}", headers=auth_headers
    ).status_code == 404
    assert db.query(Interpretation).filter(
        Interpretation.capture_id == capture_id
    ).count() == 0


def test_a_capture_is_matched_only_against_its_owners_projects(
    auth_headers, make_user, monkeypatch, db
):
    """Association is scoped, so a capture cannot land on someone else's project.

    The interpreter is no longer given project ids at all, so the risk moved
    from the prompt to the matcher -- which only ever queries the capture
    owner's rows. Named here so a future change to that query trips a test.
    """
    from app.db.models.project import Project
    from app.db.models.user import User

    me = db.query(User).filter(
        User.id == client.get("/api/v1/auth/me", headers=auth_headers).json()["id"]
    ).one()
    other_user, _ = make_user()
    # Only the other account owns a project by this name.
    db.add(Project(user_id=other_user.id, name="Nebula"))
    db.commit()

    stub = _StubInterpreter(ProposedInterpretation(type="note", confidence=0.5))
    monkeypatch.setattr(interpretation_service, "get_interpreter", lambda: stub)

    capture_id = client.post(
        "/api/v1/captures", json={"content": "the nebula deploy failed"},
        headers=auth_headers,
    ).json()["id"]

    served = client.get(
        f"/api/v1/captures/{capture_id}", headers=auth_headers
    ).json()["interpretation"]
    assert served["suggested_project_id"] is None

    # And it does match once the capture's own owner has that project.
    db.add(Project(user_id=me.id, name="Nebula"))
    db.commit()
    mine_id = client.post(
        "/api/v1/captures", json={"content": "the nebula deploy failed"},
        headers=auth_headers,
    ).json()["id"]
    matched = client.get(
        f"/api/v1/captures/{mine_id}", headers=auth_headers
    ).json()["interpretation"]
    assert matched["suggested_project_id"] is not None


def test_local_provider_confidence_does_not_reach_the_client(
    auth_headers, monkeypatch, db
):
    """End to end: an uncalibrated provider's number is stored but not served."""
    from app.db.models.interpretation import Interpretation

    class _LocalStub:
        name = "qwen2.5:3b"
        confidence_is_calibrated = False

        def interpret(self, content):
            return ProposedInterpretation(type="note", confidence=0.9)

    monkeypatch.setattr(interpretation_service, "get_interpreter", lambda: _LocalStub())

    capture_id = client.post(
        "/api/v1/captures", json={"content": "local run"}, headers=auth_headers
    ).json()["id"]

    served = client.get(
        f"/api/v1/captures/{capture_id}", headers=auth_headers
    ).json()["interpretation"]
    assert served["confidence"] is None
    assert served["model"] == "qwen2.5:3b"

    stored = (
        db.query(Interpretation).filter(Interpretation.capture_id == capture_id).one()
    )
    # Withheld from the response, still on the row.
    assert stored.confidence == 0.9
    assert stored.confidence_is_calibrated is False
