"""HTTP-level tests: status codes and JSON shape, using FakeUserStore."""
import pytest

from internal.data.repository import Repository
from internal.data.user_store.fake_user_store import FakeUserStore
from internal.server import create_app

ADA = {"username": "ada", "birthday": "1995-12-10"}


@pytest.fixture
def client():
    return create_app(repo=Repository(user_store=FakeUserStore())).test_client()


def test_create_returns_201_and_json(client):
    res = client.post("/api/users", json=ADA)
    assert res.status_code == 201
    assert res.get_json() == {"user_id": 1, "username": "ada", "birthday": "1995-12-10", "gender": None,
                              "created_at": "2026-01-01T12:00:00", "updated_at": "2026-01-01T12:00:00"}


def test_get_and_list(client):
    client.post("/api/users", json=ADA)
    assert client.get("/api/users/1").get_json()["username"] == "ada"
    assert len(client.get("/api/users").get_json()) == 1


def test_patch_updates(client):
    client.post("/api/users", json=ADA)
    res = client.patch("/api/users/1", json={"gender": "other"})
    assert res.status_code == 200
    body = res.get_json()
    assert body["gender"] == "other" and body["updated_at"] > body["created_at"]


def test_error_status_codes(client):
    client.post("/api/users", json=ADA)
    bad = client.post("/api/users", json={"username": "x"})
    assert bad.status_code == 400 and set(bad.get_json()["details"]) == {"username", "birthday"}
    assert client.post("/api/users", json=ADA).status_code == 409
    assert client.get("/api/users/99").status_code == 404
    assert client.post("/api/users", data="not json").status_code == 400
