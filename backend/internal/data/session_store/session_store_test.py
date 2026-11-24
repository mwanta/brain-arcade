from datetime import timedelta

from internal.data.check_in_store import CheckInStore
from internal.data.game_play_store import GamePlayStore
from internal.data.session_store import SessionStore
from internal.models.check_in import CreateCheckInRequest


def test_create_get_list_end(db, make_player):
    player = make_player()
    store = SessionStore(db)
    first, second = store.create(player.player_id), store.create(player.player_id)
    assert first.ended_at is None and store.get_by_id(first.session_id) == first
    assert [s.session_id for s in store.list_by_player(player.player_id)] == [
        second.session_id,
        first.session_id,
    ]
    ended = store.end(first.session_id)
    assert ended.ended_at is not None
    assert store.end(first.session_id).ended_at == ended.ended_at  # second end is a no-op
    assert store.get_by_id(0) is None


def test_end_at_sets_the_given_time_once(db, make_player):
    player = make_player()
    store = SessionStore(db)
    session = store.create(player.player_id)
    when = session.started_at + timedelta(minutes=30)
    assert store.end_at(session.session_id, when).ended_at == when
    assert store.end_at(session.session_id, when + timedelta(hours=1)).ended_at == when


def test_delete_if_empty_keeps_sessions_with_a_check_in_or_finished_play(db, make_player):
    player = make_player()
    sessions = SessionStore(db)
    plays = GamePlayStore(db)
    empty, with_check_in, with_finished_play, with_open_play = (
        sessions.create(player.player_id) for _ in range(4)
    )
    CheckInStore(db).create(with_check_in.session_id, CreateCheckInRequest())
    finished = plays.create(with_finished_play.session_id, 1)
    plays.finish(finished.play_id)
    plays.create(with_open_play.session_id, 1)

    assert sessions.delete_if_empty(empty.session_id) is True
    assert sessions.delete_if_empty(with_open_play.session_id) is True  # its play goes with it
    assert sessions.delete_if_empty(with_check_in.session_id) is False
    assert sessions.delete_if_empty(with_finished_play.session_id) is False
    assert sessions.get_by_id(empty.session_id) is None
    assert sessions.get_by_id(with_check_in.session_id) is not None
