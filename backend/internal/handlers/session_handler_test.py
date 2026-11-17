import pytest

from internal.errors import ConflictError, NotFoundError
from internal.handlers.session_handler import SessionHandler
from internal.models.check_in import CreateCheckInRequest
from internal.models.session import StartSessionRequest


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
