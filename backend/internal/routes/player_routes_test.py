"""HTTP-level tests: status codes and JSON shape, using FakePlayerStore."""

import pytest

from internal.data.player_store.fake_player_store import FakePlayerStore
from internal.data.repository import Repository
from internal.server import create_app

ADA = {"username": "ada", "birthday": "1995-12-10"}


@pytest.fixture
def client():
    return create_app(repo=Repository(player_store=FakePlayerStore())).test_client()


def test_create_returns_201_and_json(client):
    res = client.post("/api/players", json=ADA)
    assert res.status_code == 201
    assert res.get_json() == {
        "player_id": 1,
        "username": "ada",
        "birthday": "1995-12-10",
        "gender": None,
        "occupation": None,
        "education_level": None,
        "created_at": "2026-01-01T12:00:00",
        "updated_at": "2026-01-01T12:00:00",
    }


def test_get_and_list(client):
    client.post("/api/players", json=ADA)
    assert client.get("/api/players/1").get_json()["username"] == "ada"
    assert len(client.get("/api/players").get_json()) == 1


def test_patch_updates(client):
    client.post("/api/players", json=ADA)
    res = client.patch("/api/players/1", json={"gender": "other"})
    assert res.status_code == 200
    body = res.get_json()
    assert body["gender"] == "other" and body["updated_at"] > body["created_at"]


def test_error_status_codes(client):
    client.post("/api/players", json=ADA)
    bad = client.post("/api/players", json={"username": "x"})
    assert bad.status_code == 400 and set(bad.get_json()["details"]) == {"username", "birthday"}
    assert client.post("/api/players", json=ADA).status_code == 409
    assert client.get("/api/players/99").status_code == 404
    assert client.post("/api/players", data="not json").status_code == 400


def test_login(client):
    created = client.post("/api/players", json=ADA).get_json()
    res = client.post("/api/login", json={"username": "ada"})
    assert res.status_code == 200 and res.get_json() == created
    assert client.post("/api/login", json={"username": "nobody"}).status_code == 404
    assert client.post("/api/login", json={}).status_code == 400
