import pytest

from internal.server import create_app


@pytest.fixture
def client(fake_repo):
    return create_app(repo=fake_repo).test_client()


@pytest.fixture
def play_id(client):
    sid = client.post("/api/sessions", json={"player_id": 1}).get_json()["session_id"]
    res = client.post("/api/game-plays", json={"session_id": sid, "game_id": 1})
    assert res.status_code == 201
    return res.get_json()["play_id"]


def test_play_lifecycle(client, play_id):
    res = client.post(
        f"/api/game-plays/{play_id}/attempts", json={"level_id": 1, "passed": True, "duration_ms": 800}
    )
    assert res.status_code == 201 and res.get_json()["passed"] is True
    assert len(client.get(f"/api/game-plays/{play_id}/attempts").get_json()) == 1
    assert client.post(f"/api/game-plays/{play_id}/finish").get_json()["finished_at"] is not None
    assert client.post(f"/api/game-plays/{play_id}/finish").status_code == 409
    sid = client.get(f"/api/game-plays/{play_id}").get_json()["session_id"]
    assert [p["play_id"] for p in client.get(f"/api/sessions/{sid}/game-plays").get_json()] == [play_id]


def test_errors(client, play_id):
    wrong_game = client.post(f"/api/game-plays/{play_id}/attempts", json={"level_id": 3, "passed": True})
    assert wrong_game.status_code == 400 and "level_id" in wrong_game.get_json()["details"]
    assert client.post(f"/api/game-plays/{play_id}/attempts", json={"level_id": 1}).status_code == 400
    assert client.post("/api/game-plays", json={"session_id": 99, "game_id": 1}).status_code == 404
    assert client.get("/api/game-plays/99").status_code == 404
