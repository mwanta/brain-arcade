from internal.data.game_play_store import GamePlayStore
from internal.data.level_attempt_store import LevelAttemptStore
from internal.data.level_store import LevelStore
from internal.data.session_store import SessionStore
from internal.models.level_attempt import CreateLevelAttemptRequest


def test_create_get_list_finish_and_score(db, make_player):
    session = SessionStore(db).create(make_player().player_id)
    store = GamePlayStore(db)
    play = store.create(session.session_id, 1)
    assert play.score == 0 and play.finished_at is None
    assert store.list_by_session(session.session_id) == [play]

    lvl1, lvl2 = LevelStore(db).list_by_game(1)[:2]
    attempts = LevelAttemptStore(db)
    attempts.create(play.play_id, CreateLevelAttemptRequest(lvl1.level_id, True))
    attempts.create(play.play_id, CreateLevelAttemptRequest(lvl2.level_id, False))
    assert store.get_by_id(play.play_id).score == lvl1.level_number  # score comes from the view

    finished = store.finish(play.play_id)
    assert finished.finished_at is not None
    assert store.finish(play.play_id).finished_at == finished.finished_at  # no-op
    assert store.get_by_id(0) is None
