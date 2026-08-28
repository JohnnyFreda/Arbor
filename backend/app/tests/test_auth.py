import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User
from app.core.security import get_password_hash

client = TestClient(app)


@pytest.fixture
def db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_user(db):
    # Get-or-create: this fixture is function-scoped but always uses the same
    # address, so a plain insert collides on users.email the second time it runs.
    user = db.query(User).filter(User.email == "test@example.com").first()
    if user is None:
        user = User(
            email="test@example.com",
            password_hash=get_password_hash("testpassword")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def test_register():
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    assert "email" in response.json()
    assert response.json()["email"] == "newuser@example.com"


def test_register_duplicate_email():
    # Register first user
    client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"}
    )
    
    # Try to register again with same email
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"}
    )
    assert response.status_code == 400


def test_login(test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.cookies


def test_login_invalid_credentials():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_get_me(test_user):
    # Login first
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"}
    )
    access_token = login_response.json()["access_token"]
    
    # Get current user
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

