from datetime import date

import pytest

from internal.data.player_store.fake_player_store import FakePlayerStore
from internal.data.repository import Repository
from internal.errors import ConflictError, NotFoundError
from internal.handlers.player_handler import PlayerHandler
from internal.models.player import CreatePlayerRequest, LoginRequest, UpdatePlayerRequest

BDAY = date(1995, 12, 10)


@pytest.fixture
def handler():
    return PlayerHandler(Repository(player_store=FakePlayerStore()))


def test_create_then_get(handler):
    created = handler.create_player(CreatePlayerRequest("ada", BDAY, "female"))
    assert handler.get_player(created.player_id) == created
    assert handler.list_players() == [created]


def test_create_duplicate_username_conflicts(handler):
    handler.create_player(CreatePlayerRequest("ada", BDAY))
    with pytest.raises(ConflictError):
        handler.create_player(CreatePlayerRequest("ada", BDAY))


def test_update_applies_only_changed_fields(handler):
    player = handler.create_player(CreatePlayerRequest("ada", BDAY, "female"))
    updated = handler.update_player(player.player_id, UpdatePlayerRequest.from_json({"username": "ada2"}))
    assert (updated.username, updated.birthday, updated.gender) == ("ada2", BDAY, "female")
    assert updated.updated_at > player.updated_at
    assert updated.created_at == player.created_at


def test_update_to_own_username_is_allowed(handler):
    player = handler.create_player(CreatePlayerRequest("ada", BDAY))
    assert (
        handler.update_player(player.player_id, UpdatePlayerRequest.from_json({"username": "ada"})).username
        == "ada"
    )


def test_update_to_taken_username_conflicts(handler):
    handler.create_player(CreatePlayerRequest("ada", BDAY))
    alan = handler.create_player(CreatePlayerRequest("alan", BDAY))
    with pytest.raises(ConflictError):
        handler.update_player(alan.player_id, UpdatePlayerRequest.from_json({"username": "ada"}))


def test_missing_player_raises_not_found(handler):
    with pytest.raises(NotFoundError):
        handler.get_player(99)
    with pytest.raises(NotFoundError):
        handler.update_player(99, UpdatePlayerRequest.from_json({"gender": "male"}))


def test_login_finds_player_by_username(handler):
    created = handler.create_player(CreatePlayerRequest("ada", BDAY))
    assert handler.login(LoginRequest("ada")) == created
    with pytest.raises(NotFoundError):
        handler.login(LoginRequest("nobody"))
