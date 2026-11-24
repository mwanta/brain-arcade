from datetime import date, datetime

import pytest

from internal.errors import ConflictError, NotFoundError
from internal.handlers.session_handler import SessionHandler, last_activity
from internal.models.check_in import CreateCheckInRequest
from internal.models.game_play import GamePlay
from internal.models.player import CreatePlayerRequest
from internal.models.session import Session, StartSessionRequest


@pytest.fixture
def handler(fake_repo):
    return SessionHandler(fake_repo)


def test_start_get_and_list(handler):
    session = handler.start_session(StartSessionRequest(1))
    assert handler.get_session(session.session_id) == session
    assert handler.list_player_sessions(1) == [session]


def test_start_session_for_missing_player(handler):
    with pytest.raises(NotFoundError):
        handler.start_session(StartSessionRequest(99))
    with pytest.raises(NotFoundError):
        handler.list_player_sessions(99)


def test_end_session_only_once(handler):
    session = handler.start_session(StartSessionRequest(1))
    assert handler.end_session(session.session_id).ended_at is not None
    with pytest.raises(ConflictError):
        handler.end_session(session.session_id)


def test_check_in_once_per_session(handler):
    session = handler.start_session(StartSessionRequest(1))
    with pytest.raises(NotFoundError):
        handler.get_check_in(session.session_id)
    created = handler.create_check_in(session.session_id, CreateCheckInRequest(stress_level=2))
    assert handler.get_check_in(session.session_id) == created
    with pytest.raises(ConflictError):
        handler.create_check_in(session.session_id, CreateCheckInRequest())


def test_check_in_for_missing_session(handler):
    with pytest.raises(NotFoundError):
        handler.create_check_in(99, CreateCheckInRequest())


# --- cleaning up stale sessions when a new one starts ---------------------------------------
#
# The fake session store starts session N at 09:00 + N hours, so with sessions 1-3 made first,
# the one started by the handler is session 4 at 13:00: session 1 is 3h old, 2 is 2h, 3 is 1h.


def _make_sessions(fake_repo, count=3, player_id=1):
    return [fake_repo.session_store.create(player_id) for _ in range(count)]


def test_last_activity_is_the_latest_time_in_the_session():
    session = Session(1, 1, datetime(2026, 1, 1, 9, 0), None)
    play = GamePlay(1, 1, 1, datetime(2026, 1, 1, 9, 30), datetime(2026, 1, 1, 10, 15), 0)
    unfinished = GamePlay(2, 1, 1, datetime(2026, 1, 1, 9, 45), None, 0)
    assert last_activity(session, []) == session.started_at
    assert last_activity(session, [play, unfinished]) == play.finished_at


def test_stale_session_with_a_finished_play_is_ended_at_its_last_activity(handler, fake_repo):
    first, _, _ = _make_sessions(fake_repo)
    play = fake_repo.game_play_store.create(first.session_id, 1)
    fake_repo.game_play_store.finish(play.play_id)
    handler.start_session(StartSessionRequest(1))
    kept = fake_repo.session_store.get_by_id(first.session_id)
    assert kept.ended_at == last_activity(first, fake_repo.game_play_store.list_by_session(1))
    assert kept.ended_at >= kept.started_at


def test_stale_session_with_a_check_in_is_ended_not_deleted(handler, fake_repo):
    first, _, _ = _make_sessions(fake_repo)
    fake_repo.check_in_store.create(first.session_id, CreateCheckInRequest(stress_level=2))
    handler.start_session(StartSessionRequest(1))
    assert fake_repo.session_store.get_by_id(first.session_id).ended_at == first.started_at


def test_stale_empty_session_is_deleted(handler, fake_repo):
    first, second, _ = _make_sessions(fake_repo)
    fake_repo.game_play_store.create(first.session_id, 1)  # an unfinished play is not enough
    handler.start_session(StartSessionRequest(1))
    assert fake_repo.session_store.get_by_id(first.session_id) is None
    assert fake_repo.session_store.get_by_id(second.session_id) is None  # exactly 2h counts


def test_recent_sessions_are_left_open(handler, fake_repo):
    _, _, third = _make_sessions(fake_repo)
    handler.start_session(StartSessionRequest(1))
    assert fake_repo.session_store.get_by_id(third.session_id) == third


def test_ended_sessions_are_left_alone(handler, fake_repo):
    first, _, _ = _make_sessions(fake_repo)
    ended = fake_repo.session_store.end(first.session_id)
    handler.start_session(StartSessionRequest(1))
    assert fake_repo.session_store.get_by_id(first.session_id) == ended


def test_other_players_sessions_are_left_alone(handler, fake_repo):
    other = fake_repo.player_store.create(CreatePlayerRequest("bob", date(1990, 5, 5)))
    theirs = fake_repo.session_store.create(other.player_id)
    _make_sessions(fake_repo)
    handler.start_session(StartSessionRequest(1))
    assert fake_repo.session_store.get_by_id(theirs.session_id) == theirs


def test_a_failing_cleanup_does_not_stop_the_new_session(handler, fake_repo, monkeypatch):
    _make_sessions(fake_repo)

    def boom(*args):
        raise RuntimeError("db down")

    monkeypatch.setattr(fake_repo.session_store, "delete_if_empty", boom)
    session = handler.start_session(StartSessionRequest(1))
    assert fake_repo.session_store.get_by_id(session.session_id) == session
