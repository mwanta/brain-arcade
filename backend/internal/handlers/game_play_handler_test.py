import pytest

from internal.errors import ConflictError, NotFoundError, ValidationError
from internal.handlers.game_play_handler import GamePlayHandler
from internal.models.game_play import StartGamePlayRequest
from internal.models.level_attempt import CreateLevelAttemptRequest


@pytest.fixture
def handler(fake_repo):
    return GamePlayHandler(fake_repo)


@pytest.fixture
def session(fake_repo):
    return fake_repo.session_store.create(player_id=1)


def test_start_get_and_list(handler, session):
    play = handler.start_play(StartGamePlayRequest(session.session_id, 1))
    assert handler.get_play(play.play_id) == play
    assert handler.list_session_plays(session.session_id) == [play]


def test_start_play_rules(handler, fake_repo, session):
    with pytest.raises(NotFoundError):
        handler.start_play(StartGamePlayRequest(99, 1))
    with pytest.raises(NotFoundError):
        handler.start_play(StartGamePlayRequest(session.session_id, 99))
    fake_repo.session_store.end(session.session_id)
    with pytest.raises(ConflictError):
        handler.start_play(StartGamePlayRequest(session.session_id, 1))


def test_finish_only_once(handler, session):
    play = handler.start_play(StartGamePlayRequest(session.session_id, 1))
    assert handler.finish_play(play.play_id).finished_at is not None
    with pytest.raises(ConflictError):
        handler.finish_play(play.play_id)


def test_record_and_list_attempts(handler, session):
    play = handler.start_play(StartGamePlayRequest(session.session_id, 1))
    first = handler.record_attempt(play.play_id, CreateLevelAttemptRequest(1, True, 900, 0))
    second = handler.record_attempt(play.play_id, CreateLevelAttemptRequest(2, False))
    assert handler.list_attempts(play.play_id) == [first, second]


def test_attempt_level_must_belong_to_plays_game(handler, session):
    play = handler.start_play(StartGamePlayRequest(session.session_id, 1))
    for level_id in (3, 99):  # level 3 is game 2's; 99 doesn't exist
        with pytest.raises(ValidationError):
            handler.record_attempt(play.play_id, CreateLevelAttemptRequest(level_id, True))


def test_no_attempts_after_finish(handler, session):
    play = handler.start_play(StartGamePlayRequest(session.session_id, 1))
    handler.finish_play(play.play_id)
    with pytest.raises(ConflictError):
        handler.record_attempt(play.play_id, CreateLevelAttemptRequest(1, True))
