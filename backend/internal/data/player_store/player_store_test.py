"""Integration tests against the real MySQL database from backend/.env.

Skipped by default because they write to the DB. Run with:
    RUN_DB_TESTS=1 .venv/bin/python -m pytest internal/data/player_store
Rows created here use a `zz_test_` username prefix and are deleted afterwards.
"""

import os
import uuid
from datetime import date

import pytest

from internal.config import Config
from internal.data.database import Database, DuplicateKeyError
from internal.data.player_store import PlayerStore
from internal.models.player import CreatePlayerRequest, UpdatePlayerRequest

pytestmark = pytest.mark.skipif(not os.getenv("RUN_DB_TESTS"), reason="set RUN_DB_TESTS=1 to run")


@pytest.fixture
def db():
    database = Database(Config())
    yield database
    with database.cursor() as cur:
        cur.execute("DELETE FROM player WHERE username LIKE 'zz_test_%%'")


@pytest.fixture
def store(db):
    return PlayerStore(db)


BDAY = date(1995, 12, 10)


def _name():
    return f"zz_test_{uuid.uuid4().hex[:10]}"


def test_create_and_read_back(store):
    name = _name()
    player = store.create(CreatePlayerRequest(name, BDAY, "other"))
    assert player.player_id and player.created_at
    assert store.get_by_id(player.player_id) == player
    assert store.get_by_username(name) == player
    assert player in store.list_all()


def test_unique_username_enforced_by_db(store):
    name = _name()
    store.create(CreatePlayerRequest(name, BDAY))
    with pytest.raises(DuplicateKeyError):
        store.create(CreatePlayerRequest(name, BDAY))


def test_partial_update(store):
    player = store.create(CreatePlayerRequest(_name(), BDAY, "female"))
    updated = store.update(player.player_id, UpdatePlayerRequest.from_json({"birthday": "2000-01-01"}))
    assert (updated.username, updated.gender) == (player.username, "female")
    assert updated.birthday == date(2000, 1, 1)
    assert updated.created_at == player.created_at and updated.updated_at >= player.updated_at


def test_update_can_clear_nullable_field(store):
    player = store.create(CreatePlayerRequest(_name(), BDAY, "female"))
    assert store.update(player.player_id, UpdatePlayerRequest.from_json({"gender": None})).gender is None


def test_missing_player_returns_none(store):
    assert store.get_by_id(0) is None
    assert store.update(0, UpdatePlayerRequest.from_json({"gender": "male"})) is None
