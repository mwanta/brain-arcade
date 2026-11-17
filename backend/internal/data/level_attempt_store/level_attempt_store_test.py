from datetime import datetime

import pymysql
import pytest

from internal.data.game_play_store import GamePlayStore
from internal.data.level_attempt_store import LevelAttemptStore
from internal.data.level_store import LevelStore
from internal.data.session_store import SessionStore
from internal.models.level_attempt import CreateLevelAttemptRequest


@pytest.fixture
def play(db, make_player):
    session = SessionStore(db).create(make_player().player_id)
    return GamePlayStore(db).create(session.session_id, 1)


def test_create_and_list_in_attempt_order(db, play):
    level = LevelStore(db).list_by_game(1)[0]
    store = LevelAttemptStore(db)
    later = store.create(
        play.play_id,
        CreateLevelAttemptRequest(level.level_id, False, 900, 2, datetime(2026, 1, 1, 9, 0, 1, 500000)),
    )
    earlier = store.create(
        play.play_id,
        CreateLevelAttemptRequest(level.level_id, True, 800, 0, datetime(2026, 1, 1, 9, 0, 1, 250000)),
    )
    assert later.started_at == datetime(2026, 1, 1, 9, 0, 1, 500000)  # millisecond precision kept
    assert [a.attempt_id for a in store.list_by_play(play.play_id)] == [earlier.attempt_id, later.attempt_id]


def test_started_at_defaults_to_now(db, play):
    level = LevelStore(db).list_by_game(1)[0]
    assert (
        LevelAttemptStore(db).create(play.play_id, CreateLevelAttemptRequest(level.level_id, True)).started_at
    )


def test_trigger_rejects_level_from_another_game(db, play):
    other_game_level = LevelStore(db).list_by_game(2)[0]
    with pytest.raises(pymysql.err.OperationalError):
        LevelAttemptStore(db).create(play.play_id, CreateLevelAttemptRequest(other_game_level.level_id, True))
