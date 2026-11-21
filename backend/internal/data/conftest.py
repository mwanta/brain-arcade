"""Fixtures for store integration tests against the real MySQL database (backend/.env).

Skipped unless RUN_DB_TESTS=1, because they write to the DB. Expects schema.sql and
seed.sql to be loaded (the catalog tests read seed data). Players made with
`make_player` use a `zz_test_` username and are deleted afterwards, which cascades to
their sessions, check-ins, plays and attempts.
"""

import os
import uuid
from datetime import date

import pytest

from internal.config import Config
from internal.data.database import Database
from internal.data.player_store import PlayerStore
from internal.models.player import CreatePlayerRequest


@pytest.fixture
def db():
    if not os.getenv("RUN_DB_TESTS"):
        pytest.skip("set RUN_DB_TESTS=1 to run")
    database = Database(Config())
    yield database
    with database.cursor() as cur:
        cur.execute("DELETE FROM player WHERE username LIKE 'zz_test_%%'")


@pytest.fixture
def make_player(db):
    store = PlayerStore(db)

    def make(birthday=date(1995, 1, 1), gender=None, occupation=None, education_level=None):
        return store.create(
            CreatePlayerRequest(
                f"zz_test_{uuid.uuid4().hex[:10]}", birthday, gender, occupation, education_level
            )
        )

    return make
