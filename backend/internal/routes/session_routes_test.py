import pytest

from internal.server import create_app


@pytest.fixture
def client(fake_repo):
    return create_app(repo=fake_repo).test_client()


def test_session_lifecycle(client):
    res = client.post("/api/sessions", json={"player_id": 1})
    assert res.status_code == 201
    sid = res.get_json()["session_id"]
    assert client.get(f"/api/sessions/{sid}").get_json()["ended_at"] is None
    assert len(client.get("/api/players/1/sessions").get_json()) == 1
    assert client.post(f"/api/sessions/{sid}/end").get_json()["ended_at"] is not None
    assert client.post(f"/api/sessions/{sid}/end").status_code == 409


def test_check_in(client):
    sid = client.post("/api/sessions", json={"player_id": 1}).get_json()["session_id"]
    assert client.get(f"/api/sessions/{sid}/check-in").status_code == 404
    res = client.post(f"/api/sessions/{sid}/check-in", json={"hours_slept": 6.5, "exercised_today": True})
    assert res.status_code == 201 and res.get_json()["hours_slept"] == 6.5
    assert client.post(f"/api/sessions/{sid}/check-in", json={}).status_code == 409
    assert client.get(f"/api/sessions/{sid}/check-in").get_json()["exercised_today"] is True


def test_errors(client):
    assert client.post("/api/sessions", json={}).status_code == 400
    assert client.post("/api/sessions", json={"player_id": 99}).status_code == 404
    assert client.get("/api/sessions/99").status_code == 404
