import pytest
from fastapi.testclient import TestClient
from copy import deepcopy
from urllib.parse import quote

import src.app as app_module


client = TestClient(app_module.app)

# Keep an immutable copy of the original activities so each test runs isolated
ORIGINAL = deepcopy(app_module.activities)


@pytest.fixture(autouse=True)
def reset_activities():
    # Reset the in-memory activities before each test
    app_module.activities.clear()
    app_module.activities.update(deepcopy(ORIGINAL))
    yield


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # basic smoke checks
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_reflects_in_get():
    email = "testuser@mergington.edu"
    activity = "Chess Club"
    resp = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # Now GET and verify the participant is present
    data = client.get("/activities").json()
    assert email in data[activity]["participants"]


def test_duplicate_signup_returns_400():
    # Use an existing participant from initial state
    activity = "Chess Club"
    existing = ORIGINAL[activity]["participants"][0]
    resp = client.post(f"/activities/{quote(activity)}/signup?email={quote(existing)}")
    assert resp.status_code == 400


def test_delete_participant_and_reflects_in_get():
    activity = "Chess Club"
    participant = ORIGINAL[activity]["participants"][0]
    # Delete
    resp = client.delete(f"/activities/{quote(activity)}/participants?email={quote(participant)}")
    assert resp.status_code == 200
    assert "Removed" in resp.json().get("message", "")

    # Verify it's gone
    data = client.get("/activities").json()
    assert participant not in data[activity]["participants"]


def test_delete_nonexistent_participant_returns_404():
    activity = "Chess Club"
    resp = client.delete(f"/activities/{quote(activity)}/participants?email={quote('notfound@mergington.edu')}")
    assert resp.status_code == 404
