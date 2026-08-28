"""Refresh-token cookie attributes.

The cookie is what keeps a session alive across a page reload. In production
the frontend and API are not same-origin, so its SameSite attribute decides
whether a reload keeps the user logged in or dumps them at the sign-in page.
"""

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)


def _login(email, password):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


@pytest.fixture
def credentials(make_user):
    user, password = make_user()
    return user.email, password


def test_login_sets_an_httponly_refresh_cookie(credentials):
    response = _login(*credentials)
    assert response.status_code == 200
    header = response.headers["set-cookie"]
    assert "refresh_token=" in header
    # httpOnly keeps it away from any script on the page.
    assert "httponly" in header.lower()


def test_cookie_attributes_follow_configuration(credentials, monkeypatch):
    """Hardcoded Lax was the bug: it is never sent cross-site.

    Production serves the frontend and the API from different sites, so the
    refresh call is cross-site and a Lax cookie is withheld -- which is why a
    reload logged the user out there but never locally.
    """
    monkeypatch.setattr(settings, "COOKIE_SAMESITE", "none")
    monkeypatch.setattr(settings, "COOKIE_SECURE", True)

    header = _login(*credentials).headers["set-cookie"].lower()
    assert "samesite=none" in header
    assert "secure" in header


def test_defaults_are_safe_for_local_development(credentials):
    header = _login(*credentials).headers["set-cookie"].lower()
    assert "samesite=lax" in header
    # Secure would stop the cookie working over plain http on localhost.
    assert "secure" not in header


def test_logout_clears_with_matching_attributes(credentials, monkeypatch):
    """A cookie is only cleared by a Set-Cookie carrying the same attributes.

    Mismatched, the browser keeps the original and logout silently does
    nothing -- the user stays logged in on the next reload.
    """
    monkeypatch.setattr(settings, "COOKIE_SAMESITE", "none")
    monkeypatch.setattr(settings, "COOKIE_SECURE", True)

    header = client.post("/api/v1/auth/logout").headers["set-cookie"].lower()
    assert "refresh_token=" in header
    assert "samesite=none" in header
    assert "secure" in header


def test_refresh_round_trips_the_cookie(credentials):
    """The whole point: the cookie alone is enough to mint a new access token."""
    login = _login(*credentials)
    assert login.status_code == 200

    refreshed = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": login.cookies["refresh_token"]},
    )
    assert refreshed.status_code == 200
    assert refreshed.json()["access_token"]


def test_refresh_without_the_cookie_is_rejected():
    # A fresh client: the module-level one carries a cookie jar across
    # requests, so an earlier login in this file would still be attached.
    with TestClient(app) as fresh:
        response = fresh.post("/api/v1/auth/refresh")
    assert response.status_code == 401
