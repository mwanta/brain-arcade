import pytest

from internal.server import create_app


@pytest.fixture
def client(fake_repo):
    return create_app(repo=fake_repo).test_client()


def test_catalog_lists(client):
    assert len(client.get("/api/domains").get_json()) == 2
    assert client.get("/api/setting-types").get_json()[0]["unit"] == "errors"
    assert [g["name"] for g in client.get("/api/games").get_json()] == ["Odd One Out", "Sequence Recall"]


def test_get_game(client):
    body = client.get("/api/games/1").get_json()
    assert body["levels"][0]["settings"] == {"time_limit": 10000, "max_errors": 0}
    assert body["levels"][1]["settings"] == {"time_limit": 8000.5}
    assert client.get("/api/games/99").status_code == 404
