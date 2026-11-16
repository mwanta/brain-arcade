"""Integration tests against the real MySQL database from backend/.env.

Skipped by default because they write to the DB. Run with:
    RUN_DB_TESTS=1 .venv/bin/python -m pytest internal/data/user_store
Rows created here use a `zz_test_` username prefix and are deleted afterwards.
"""
import os
import uuid
from datetime import date

import pytest

from internal.config import Config
from internal.data.database import Database, DuplicateKeyError
from internal.data.user_store import UserStore
from internal.models.user import CreateUserRequest, UpdateUserRequest

pytestmark = pytest.mark.skipif(not os.getenv("RUN_DB_TESTS"), reason="set RUN_DB_TESTS=1 to run")


@pytest.fixture
def db():
    database = Database(Config())
    yield database
    with database.cursor() as cur:
        cur.execute("DELETE FROM users WHERE username LIKE 'zz_test_%%'")


@pytest.fixture
def store(db):
    return UserStore(db)


BDAY = date(1995, 12, 10)


def _name():
    return f"zz_test_{uuid.uuid4().hex[:10]}"


def test_create_and_read_back(store):
    name = _name()
    user = store.create(CreateUserRequest(name, BDAY, "other"))
    assert user.user_id and user.created_at
    assert store.get_by_id(user.user_id) == user
    assert store.get_by_username(name) == user
    assert user in store.list_all()


def test_unique_username_enforced_by_db(store):
    name = _name()
    store.create(CreateUserRequest(name, BDAY))
    with pytest.raises(DuplicateKeyError):
        store.create(CreateUserRequest(name, BDAY))


def test_partial_update(store):
    user = store.create(CreateUserRequest(_name(), BDAY, "female"))
    updated = store.update(user.user_id, UpdateUserRequest.from_json({"birthday": "2000-01-01"}))
    assert (updated.username, updated.gender) == (user.username, "female")
    assert updated.birthday == date(2000, 1, 1)
    assert updated.created_at == user.created_at and updated.updated_at >= user.updated_at


def test_update_can_clear_nullable_field(store):
    user = store.create(CreateUserRequest(_name(), BDAY, "female"))
    assert store.update(user.user_id, UpdateUserRequest.from_json({"gender": None})).gender is None


def test_missing_user_returns_none(store):
    assert store.get_by_id(0) is None
    assert store.update(0, UpdateUserRequest.from_json({"gender": "male"})) is None
