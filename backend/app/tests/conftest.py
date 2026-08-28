"""Test configuration.

The repository's .env points DATABASE_URL at the hosted demo database. Tests
create users and write rows, so they must never reach it. This module forces a
throwaway SQLite file *before* app modules are imported (the engine is built at
import time in app.db.session) and then asserts the override actually took.
"""

import os
import pathlib

TEST_DB_PATH = pathlib.Path(__file__).parent / "test_devdiary.db"

# Must happen before anything imports app.core.config. Environment variables
# take precedence over .env in pydantic-settings.
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

import pytest  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db import models  # noqa: E402,F401  (registers tables on Base.metadata)
from app.db.session import SessionLocal, engine  # noqa: E402

# Fail loudly rather than quietly writing to whatever DATABASE_URL resolved to.
if engine.url.get_backend_name() != "sqlite":
    raise RuntimeError(
        f"Refusing to run tests against a {engine.url.get_backend_name()} database. "
        "Expected the SQLite override in conftest.py to apply."
    )


@pytest.fixture(scope="session", autouse=True)
def _test_database():
    """One clean database per test session."""
    TEST_DB_PATH.unlink(missing_ok=True)
    Base.metadata.create_all(bind=engine)
    yield
    engine.dispose()
    TEST_DB_PATH.unlink(missing_ok=True)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def make_user(db):
    """Create a user with a unique email so tests don't collide."""
    from app.core.security import get_password_hash
    from app.db.models.user import User

    created = []

    def _make(email=None, password="testpassword"):
        email = email or f"user{len(created)}-{id(created)}@example.com"
        user = User(email=email, password_hash=get_password_hash(password))
        db.add(user)
        db.commit()
        db.refresh(user)
        created.append(user)
        return user, password

    return _make


@pytest.fixture
def auth_headers(make_user):
    """Bearer headers for a freshly created user."""
    from fastapi.testclient import TestClient
    from app.main import app

    user, password = make_user()
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login", json={"email": user.email, "password": password}
        )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
