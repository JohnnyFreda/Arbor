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


@pytest.fixture
def auth_token(test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"}
    )
    return response.json()["access_token"]


def test_create_entry(auth_token):
    response = client.post(
        "/api/v1/entries",
        json={
            "date": "2025-01-27",
            "title": "Test Entry",
            "body": "This is a test entry",
            "mood": 4
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Test Entry"
    assert response.json()["mood"] == 4


def test_get_entries(auth_token):
    # Create an entry first
    client.post(
        "/api/v1/entries",
        json={
            "date": "2025-01-27",
            "title": "Test Entry",
            "body": "This is a test entry",
            "mood": 4
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    # Get all entries
    response = client.get(
        "/api/v1/entries",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) > 0


def test_get_entry_by_id(auth_token):
    # Create an entry
    create_response = client.post(
        "/api/v1/entries",
        json={
            "date": "2025-01-27",
            "title": "Test Entry",
            "body": "This is a test entry",
            "mood": 4
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    entry_id = create_response.json()["id"]
    
    # Get entry by ID
    response = client.get(
        f"/api/v1/entries/{entry_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    assert response.json()["id"] == entry_id


def test_update_entry(auth_token):
    # Create an entry
    create_response = client.post(
        "/api/v1/entries",
        json={
            "date": "2025-01-27",
            "title": "Test Entry",
            "body": "This is a test entry",
            "mood": 4
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    entry_id = create_response.json()["id"]
    
    # Update entry
    response = client.put(
        f"/api/v1/entries/{entry_id}",
        json={
            "title": "Updated Entry",
            "mood": 5
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Entry"
    assert response.json()["mood"] == 5


def test_delete_entry(auth_token):
    # Create an entry
    create_response = client.post(
        "/api/v1/entries",
        json={
            "date": "2025-01-27",
            "title": "Test Entry",
            "body": "This is a test entry",
            "mood": 4
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    entry_id = create_response.json()["id"]
    
    # Delete entry
    response = client.delete(
        f"/api/v1/entries/{entry_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 204
    
    # Verify entry is deleted
    get_response = client.get(
        f"/api/v1/entries/{entry_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert get_response.status_code == 404

