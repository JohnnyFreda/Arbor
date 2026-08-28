"""Reset the shared guest account to a realistic, well-populated diary.

The demo's "Continue as guest" drops everyone into one shared account, so a
visitor sees whatever the last person left behind. Empty or half-filled, the
dashboard, streak and mood trend all render as nothing -- which is precisely
the part of the app worth showing.

This wipes that account and rebuilds ~9 weeks of entries ending today. The
streak calculation counts back from today, so the data is anchored to the run
date and goes stale if this is not re-run; that is what the scheduled reset is
for.

Usage:
    python -m scripts.seed_guest
    python -m scripts.seed_guest --days 90 --email guest@example.com
"""

from __future__ import annotations

import argparse
import random
from datetime import date, datetime, timedelta, timezone

from app.core.security import get_password_hash
from app.db.models.capture import Capture, ProcessingStatus
from app.db.models.entry import Entry
from app.db.models.entry_tag import entry_tags
from app.db.models.interpretation import Interpretation
from app.db.models.task import Task, TaskStatus, TaskType
from app.db.models.project import Project
from app.db.models.tag import Tag
from app.db.models.user import User
from app.db.session import SessionLocal

GUEST_EMAIL = "guest@example.com"
GUEST_PASSWORD = "guest123"  # matches AuthContext.guestLogin in the frontend
DEFAULT_DAYS = 63

PROJECTS = [
    ("Tourify", "Live-music tour finder. FastAPI + PostGIS backend, Expo client."),
    ("DevDiary", "This app. Daily logging, mood tracking, insights."),
    ("Portfolio", "Personal site and project write-ups."),
    ("Learning", "Reading, courses, and side experiments."),
]

TAGS = [
    "feature", "bugfix", "refactor", "testing", "docs",
    "deploy", "debugging", "planning", "reading", "design",
]

# Unprocessed captures so the Inbox has something to show. Deliberately messy
# and unstructured -- that is what a real quick capture looks like.
CAPTURES = [
    ("still getting logged out after leaving the tab open overnight -- refresh token?", "desktop"),
    ("idea: let projects link to a github repo so the dashboard can show recent PRs", "desktop"),
    ("ask about the rate limit on the tour search endpoint before we ship", "mobile"),
    ("blocked on the staging db creds, nobody seems to own them", "mobile"),
    ("that N+1 in the calendar query is going to bite us at 10k entries", "desktop"),
    ("remember to write up why we went with capture-first instead of a form", "voice"),
]

# Accepted work, so the dashboard has open tasks and a blocker to show.
# (title, type, status, priority, project index)
TASKS = [
    ("Add a regression test for the refresh-token expiry", TaskType.TASK, TaskStatus.OPEN, "high", 1),
    ("Index entries.date before the calendar query gets slow", TaskType.TASK, TaskStatus.OPEN, "medium", 1),
    ("Write up the capture-first decision as an ADR", TaskType.TASK, TaskStatus.OPEN, "low", 1),
    ("Staging database credentials -- nobody owns them", TaskType.BLOCKER, TaskStatus.OPEN, "high", 0),
    ("Confirm the tour search rate limit before shipping", TaskType.BLOCKER, TaskStatus.OPEN, None, 0),
    ("Split the seed script out of the migration", TaskType.TASK, TaskStatus.DONE, None, 1),
]

# (title, body, looking_ahead, tags, mood_bias) -- mood_bias nudges the day's
# mood so a debugging slog reads lower than a shipping day.
TEMPLATES = [
    ("Shipped the {feature}", "Got {feature} working end to end today. The tricky part was {detail} -- ended up {fix}. Tests pass and it's deployed.", "Write up the decision while it's fresh.", ["feature", "deploy"], 1),
    ("Chased a {bug} for hours", "Spent most of the day on {detail}. Turned out to be {fix}. Frustrating, but at least it's understood now.", "Add a regression test so this can't come back.", ["bugfix", "debugging"], -1),
    ("Refactored {feature}", "{feature} had grown organically and was hard to follow. Pulled the shared logic out and {fix}. No behaviour change, much easier to read.", "Do the same for the neighbouring module.", ["refactor"], 0),
    ("Test coverage pass", "Added tests around {feature}. Found {detail} while writing them, which is the usual story.", "Wire the suite into CI.", ["testing"], 0),
    ("Wrote docs for {feature}", "Documented {feature} -- setup, the schema, and the bits that surprised me. Writing it down surfaced {detail}.", "Get someone to follow the steps cold.", ["docs"], 0),
    ("Planning session", "Mapped out the next chunk of work. Decided to {fix} rather than the bigger rewrite -- smaller steps, faster feedback.", "Break the first milestone into day-sized pieces.", ["planning", "design"], 0),
    ("Deployed to production", "Pushed {feature} live. Watched the logs for a while -- nothing but the usual noise. Held up fine under real traffic.", "Set up an alert so I'm not watching logs by hand.", ["deploy"], 1),
    ("Read up on {feature}", "Spent the morning reading about {detail}. Changed how I want to approach {feature} -- {fix} looks much cleaner.", "Prototype the approach on a branch.", ["reading", "design"], 0),
    ("Slow day", "Not much progress. Got stuck on {detail} and went round in circles. Stopped early rather than force it.", "Come back to it fresh.", ["debugging"], -2),
    ("Good momentum", "One of those days where everything worked. Finished {feature}, cleaned up {detail}, and still had time to {fix}.", "Keep the run going.", ["feature", "refactor"], 2),
]

FEATURES = ["the auth flow", "radius search", "the calendar view", "tag filtering",
            "the ingest pipeline", "mood trends", "the entry editor", "JWT refresh",
            "the dashboard", "schema validation", "the seed scripts", "CORS handling"]
DETAILS = ["a timezone off-by-one", "an N+1 query", "a stale cache", "a missing index",
           "an unhandled null", "a race in the refresh logic", "a bad migration ordering",
           "silent error swallowing", "a misconfigured env var", "an async deadlock"]
FIXES = ["pulling it into a service", "adding an index", "memoising the lookup",
         "making the failure explicit", "splitting the transaction", "caching the result",
         "narrowing the type", "handling the empty case up front"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", default=GUEST_EMAIL)
    ap.add_argument("--days", type=int, default=DEFAULT_DAYS)
    ap.add_argument("--seed", type=int, default=20260827, help="rng seed; fixed so resets are reproducible")
    args = ap.parse_args()
    rng = random.Random(args.seed)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == args.email).first()
        created = user is None
        if user is None:
            user = User(email=args.email, password_hash=get_password_hash(GUEST_PASSWORD))
            db.add(user)
            db.flush()

        # Wipe prior demo content. Tasks, interpretations and entry_tags go
        # first: each references rows we are about to delete, none cascade.
        db.query(Task).filter(Task.user_id == user.id).delete(synchronize_session=False)

        capture_ids = [c.id for c in db.query(Capture.id).filter(Capture.user_id == user.id).all()]
        if capture_ids:
            db.query(Interpretation).filter(
                Interpretation.capture_id.in_(capture_ids)
            ).delete(synchronize_session=False)
        db.query(Capture).filter(Capture.user_id == user.id).delete(synchronize_session=False)

        entry_ids = [e.id for e in db.query(Entry.id).filter(Entry.user_id == user.id).all()]
        if entry_ids:
            db.execute(entry_tags.delete().where(entry_tags.c.entry_id.in_(entry_ids)))
        db.query(Entry).filter(Entry.user_id == user.id).delete(synchronize_session=False)
        db.query(Tag).filter(Tag.user_id == user.id).delete(synchronize_session=False)
        db.query(Project).filter(Project.user_id == user.id).delete(synchronize_session=False)
        db.flush()

        projects = [Project(user_id=user.id, name=n, description=d) for n, d in PROJECTS]
        tags = [Tag(user_id=user.id, name=t) for t in TAGS]
        db.add_all(projects + tags)
        db.flush()
        by_tag = {t.name: t for t in tags}

        today = date.today()
        rows = 0
        for offset in range(args.days):
            day = today - timedelta(days=offset)
            # Skip some weekends, but never break the last 12 days: the streak
            # is the headline number on the dashboard.
            if offset > 12 and day.weekday() >= 5 and rng.random() < 0.65:
                continue
            if offset > 12 and rng.random() < 0.10:
                continue

            # Today's entry is the first thing a visitor reads, so keep it a
            # good day; the rest stays varied, slow days included.
            if offset == 0:
                title_t, body_t, ahead, tag_names, bias = TEMPLATES[9]
            else:
                title_t, body_t, ahead, tag_names, bias = rng.choice(TEMPLATES)
            subs = {
                "feature": rng.choice(FEATURES),
                "detail": rng.choice(DETAILS),
                "fix": rng.choice(FIXES),
                "bug": rng.choice(["bug", "regression", "flaky test"]),
            }
            # Mood drifts upward over time so the trend chart has a shape.
            base = 3.1 + (args.days - offset) / args.days * 0.8
            mood = max(1, min(5, round(base + bias * 0.6 + rng.uniform(-0.7, 0.7))))
            entry = Entry(
                user_id=user.id,
                project_id=rng.choice(projects).id,
                date=day,
                title=title_t.format(**subs),
                body=body_t.format(**subs),
                looking_ahead=ahead,
                mood=mood,
                focus_score=max(1, min(10, mood * 2 + rng.randint(-2, 1))),
            )
            db.add(entry)
            db.flush()
            for name in tag_names:
                db.execute(entry_tags.insert().values(entry_id=entry.id, tag_id=by_tag[name].id))
            rows += 1

        for text, source in CAPTURES:
            db.add(Capture(
                user_id=user.id,
                content=text,
                source=source,
                processing_status=ProcessingStatus.PENDING,
            ))

        for title, kind, status, priority, project_index in TASKS:
            db.add(Task(
                user_id=user.id,
                project_id=projects[project_index].id,
                type=kind,
                title=title,
                status=status,
                priority=priority,
                completed_at=(
                    datetime.now(timezone.utc) if status == TaskStatus.DONE else None
                ),
            ))

        db.commit()
    finally:
        db.close()

    print(f"{'created' if created else 'reset'} {args.email} (password: {GUEST_PASSWORD})")
    print(f"  {rows} entries across {args.days} days, ending today ({today})")
    print(f"  {len(PROJECTS)} projects, {len(TAGS)} tags")
    print(f"  {len(CAPTURES)} unprocessed captures in the inbox")
    open_tasks = sum(1 for _, _, s, _, _ in TASKS if s == TaskStatus.OPEN)
    blockers = sum(1 for _, k, s, _, _ in TASKS if k == TaskType.BLOCKER and s == TaskStatus.OPEN)
    print(f"  {open_tasks} open tasks ({blockers} blockers)")


if __name__ == "__main__":
    main()
