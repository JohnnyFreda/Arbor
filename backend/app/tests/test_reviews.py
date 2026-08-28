"""Daily review tests.

The review is a proposal assembled from rows the user already made. The things
worth pinning down are that it never invents work, never writes anything, and
scopes strictly to the day and the owner.
"""

from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.db.models.capture import Capture, ProcessingStatus
from app.db.models.entry import Entry
from app.db.models.interpretation import Interpretation, InterpretationStatus
from app.db.models.project import Project
from app.db.models.task import Task, TaskStatus, TaskType
from app.main import app

client = TestClient(app)

TODAY = date.today()
YESTERDAY = TODAY - timedelta(days=1)


@pytest.fixture
def owner(make_user, db):
    """A user plus the ids a test needs to hang rows off."""
    user, password = make_user()
    token = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": password}
    ).json()["access_token"]
    project = Project(user_id=user.id, name="Arbor")
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "user": user,
        "headers": {"Authorization": f"Bearer {token}"},
        "project": project,
    }


def _capture(db, user_id, text, when=None, accepted_type=None):
    capture = Capture(
        user_id=user_id,
        content=text,
        source="desktop",
        processing_status=ProcessingStatus.SKIPPED,
    )
    if when:
        capture.created_at = when
    else:
        # Mirrors the column default, which is UTC -- not local.
        capture.created_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.add(capture)
    db.commit()
    db.refresh(capture)
    if accepted_type:
        db.add(
            Interpretation(
                capture_id=capture.id,
                type=accepted_type,
                status=InterpretationStatus.ACCEPTED,
                confidence=0.9,
            )
        )
        db.commit()
    return capture


def _task(db, user_id, title, *, kind=TaskType.TASK, status=TaskStatus.OPEN,
          priority=None, completed=None, project_id=None):
    task = Task(
        user_id=user_id, title=title, type=kind, status=status,
        priority=priority, completed_at=completed, project_id=project_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


# The endpoint takes the caller's offset east of UTC. Tests use the machine's
# own, so "today" means the same thing on both sides.
LOCAL_OFFSET = round(
    (datetime.now() - datetime.now(timezone.utc).replace(tzinfo=None)).total_seconds() / 60
)


def _review(headers, day=None, offset=None):
    params = {"utc_offset_minutes": LOCAL_OFFSET if offset is None else offset}
    if day:
        params["date"] = day.isoformat()
    response = client.get("/api/v1/reviews/daily", params=params, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


# --- empty day -----------------------------------------------------------


def test_quiet_day_is_empty_not_an_error(owner):
    review = _review(owner["headers"])
    assert review["is_empty"] is True
    assert review["proposed_body"] == ""
    assert review["capture_count"] == 0


# --- what goes in --------------------------------------------------------


def test_body_quotes_the_capture_not_the_interpretation(owner, db):
    """The raw text is the record; quoting a paraphrase would lose it."""
    _capture(db, owner["user"].id, "auth feels broken after idle", accepted_type="task")
    review = _review(owner["headers"])
    assert "auth feels broken after idle" in review["proposed_body"]
    assert "_(task)_" in review["proposed_body"]


def test_unaccepted_captures_carry_no_type(owner, db):
    _capture(db, owner["user"].id, "just a thought")
    review = _review(owner["headers"])
    assert "just a thought" in review["proposed_body"]
    assert "_(" not in review["proposed_body"]


def test_completed_work_is_listed_with_its_project(owner, db):
    _task(db, owner["user"].id, "Ship the inbox", status=TaskStatus.DONE,
          completed=datetime.now(timezone.utc).replace(tzinfo=None), project_id=owner["project"].id)
    review = _review(owner["headers"])
    assert "**Finished**" in review["proposed_body"]
    assert "Ship the inbox — Arbor" in review["proposed_body"]
    assert review["completed_count"] == 1


def test_open_blockers_appear_even_though_they_did_not_happen_today(owner, db):
    _task(db, owner["user"].id, "Staging creds unowned", kind=TaskType.BLOCKER)
    _capture(db, owner["user"].id, "something")
    review = _review(owner["headers"])
    assert "**Still blocked**" in review["proposed_body"]
    assert review["blocker_count"] == 1


# --- the day boundary ----------------------------------------------------


def test_yesterdays_captures_are_not_in_todays_review(owner, db):
    _capture(db, owner["user"].id, "yesterday thought",
             when=datetime.combine(YESTERDAY, datetime.min.time()) + timedelta(hours=10)
                  - timedelta(minutes=LOCAL_OFFSET))
    _capture(db, owner["user"].id, "today thought")
    review = _review(owner["headers"])
    assert "today thought" in review["proposed_body"]
    assert "yesterday thought" not in review["proposed_body"]
    assert review["capture_count"] == 1


def test_an_explicit_date_reviews_that_day(owner, db):
    _capture(db, owner["user"].id, "yesterday thought",
             when=datetime.combine(YESTERDAY, datetime.min.time()) + timedelta(hours=10)
                  - timedelta(minutes=LOCAL_OFFSET))
    review = _review(owner["headers"], day=YESTERDAY)
    assert "yesterday thought" in review["proposed_body"]
    assert review["date"] == YESTERDAY.isoformat()


# --- looking ahead -------------------------------------------------------


def test_first_action_is_an_existing_task_never_invented(owner, db):
    _task(db, owner["user"].id, "Low thing", priority="low")
    _task(db, owner["user"].id, "High thing", priority="high")
    review = _review(owner["headers"])
    assert review["proposed_looking_ahead"].startswith("Start with: High thing.")


def test_a_blocker_outranks_ordinary_work(owner, db):
    _task(db, owner["user"].id, "High thing", priority="high")
    _task(db, owner["user"].id, "Nobody owns the creds", kind=TaskType.BLOCKER)
    review = _review(owner["headers"])
    ahead = review["proposed_looking_ahead"]
    assert ahead.startswith("Start with: Nobody owns the creds.")
    # The blocker just named must not also be counted as still blocked.
    assert "blocked" not in ahead, ahead


def test_nothing_open_means_nothing_suggested(owner, db):
    _capture(db, owner["user"].id, "a thought")
    assert _review(owner["headers"])["proposed_looking_ahead"] == ""


# --- title ---------------------------------------------------------------


def test_one_finished_task_proposes_a_title(owner, db):
    _task(db, owner["user"].id, "Ship the inbox", status=TaskStatus.DONE,
          completed=datetime.now(timezone.utc).replace(tzinfo=None))
    assert _review(owner["headers"])["proposed_title"] == "Ship the inbox"


def test_several_finished_tasks_propose_no_title(owner, db):
    """Guessing a headline from a mixed day puts words in the user's mouth."""
    for name in ("One", "Two"):
        _task(db, owner["user"].id, name, status=TaskStatus.DONE,
              completed=datetime.now(timezone.utc).replace(tzinfo=None))
    assert _review(owner["headers"])["proposed_title"] is None


# --- it proposes, it does not write --------------------------------------


def test_review_writes_nothing(owner, db):
    _capture(db, owner["user"].id, "a thought")
    before = db.query(Entry).filter(Entry.user_id == owner["user"].id).count()
    _review(owner["headers"])
    _review(owner["headers"])
    assert db.query(Entry).filter(Entry.user_id == owner["user"].id).count() == before


def test_existing_entry_is_surfaced_so_a_second_is_not_created(owner, db):
    entry = Entry(user_id=owner["user"].id, date=TODAY, title="Already written", mood=4)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    assert _review(owner["headers"])["existing_entry_id"] == entry.id


# --- scoping -------------------------------------------------------------


def test_review_is_scoped_to_its_owner(owner, db, make_user):
    other, password = make_user()
    _capture(db, other.id, "someone else's thought")
    _task(db, other.id, "someone else's task")
    review = _review(owner["headers"])
    assert "someone else's thought" not in review["proposed_body"]
    assert review["proposed_looking_ahead"] == ""
    assert review["is_empty"] is True


def test_review_requires_authentication():
    assert client.get("/api/v1/reviews/daily").status_code == 401


# --- the timezone bug this endpoint was built around ---------------------


def test_evening_capture_west_of_utc_stays_in_todays_review(owner, db):
    """23:00 in UTC-5 is already tomorrow in UTC.

    Comparing a local date against UTC timestamps drops the whole evening for
    anyone west of UTC. Their captures would silently not be in the review of
    the day they made them.
    """
    offset = -300  # UTC-5
    local_evening = datetime(2026, 3, 10, 23, 30)
    stored_utc = local_evening - timedelta(minutes=offset)  # 2026-03-11 04:30 UTC
    assert stored_utc.date() != local_evening.date(), "fixture must straddle midnight"

    _capture(db, owner["user"].id, "late night thought", when=stored_utc)

    review = _review(owner["headers"], day=local_evening.date(), offset=offset)
    assert "late night thought" in review["proposed_body"]
    assert review["capture_count"] == 1

    # And it belongs to that day only -- not to the UTC one.
    next_day = _review(owner["headers"], day=stored_utc.date(), offset=offset)
    assert "late night thought" not in next_day["proposed_body"]


def test_remaining_blocked_count_excludes_the_one_named(owner, db):
    _task(db, owner["user"].id, "Ordinary work")
    _task(db, owner["user"].id, "First blocker", kind=TaskType.BLOCKER, priority="high")
    _task(db, owner["user"].id, "Second blocker", kind=TaskType.BLOCKER)
    ahead = _review(owner["headers"])["proposed_looking_ahead"]
    assert ahead.startswith("Start with: First blocker.")
    assert "2 others still open, 1 of them blocked." in ahead, ahead
