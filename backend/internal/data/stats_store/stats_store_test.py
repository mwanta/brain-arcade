"""Stats SQL against real data. Test players are born in 1930 so their age group
(90s) contains no seed players and the comparison only sees players made here."""

from datetime import date

import pytest

from internal.data.game_play_store import GamePlayStore
from internal.data.level_attempt_store import LevelAttemptStore
from internal.data.level_store import LevelStore
from internal.data.session_store import SessionStore
from internal.data.stats_store import StatsStore
from internal.models.level_attempt import CreateLevelAttemptRequest
from internal.models.stats import StatsQuery

BIRTHDAY = date(1930, 6, 1)


@pytest.fixture
def play_game(db):
    """play_game(player, passed_levels, finish=True) -> play with that many levels passed on game 1."""
    levels = LevelStore(db).list_by_game(1)
    sessions, plays, attempts = SessionStore(db), GamePlayStore(db), LevelAttemptStore(db)

    def play(player, passed_levels, finish=True):
        session = sessions.create(player.player_id)
        game_play = plays.create(session.session_id, 1)
        for lvl in levels[:passed_levels]:
            attempts.create(game_play.play_id, CreateLevelAttemptRequest(lvl.level_id, True))
        if passed_levels < len(levels):
            attempts.create(
                game_play.play_id, CreateLevelAttemptRequest(levels[passed_levels].level_id, False)
            )
        return plays.finish(game_play.play_id) if finish else game_play

    return play


@pytest.fixture
def players(make_player, play_game):
    """Three same-age players: me (scores 2 and 1, plus an unfinished 3), peer_low (0), peer_high (3)."""
    me, low, high = make_player(BIRTHDAY), make_player(BIRTHDAY), make_player(BIRTHDAY)
    play_game(me, 2)
    play_game(me, 1)
    play_game(me, 3, finish=False)  # unfinished: excluded from all stats
    play_game(low, 0)
    play_game(high, 3)
    return me, low, high


def test_score_history_is_finished_plays_in_order(db, players):
    me = players[0]
    history = StatsStore(db).score_history(me.player_id, StatsQuery())
    assert [h.score for h in history] == [2, 1]
    assert all(h.game_name for h in history)


def test_game_summaries(db, players):
    [summary] = StatsStore(db).game_summaries(players[0].player_id, StatsQuery())
    assert (summary.plays, summary.best_score, float(summary.avg_score)) == (2, 2, 1.5)


def test_age_group_comparison(db, players):
    [cmp] = StatsStore(db).age_group_comparison(players[0].player_id, StatsQuery())
    assert cmp.age_group_start == 90 and cmp.age_group_player_count == 3
    assert float(cmp.player_avg_score) == 1.5
    assert float(cmp.age_group_avg_score) == pytest.approx((1.5 + 0 + 3) / 3)
    assert cmp.percentile == 0.5  # beats 1 of the 2 others


def test_filters(db, players):
    store, me = StatsStore(db), players[0]
    assert store.score_history(me.player_id, StatsQuery(from_date=date(2999, 1, 1))) == []
    assert len(store.score_history(me.player_id, StatsQuery(from_date=date(2000, 1, 1)))) == 2
    assert store.game_summaries(me.player_id, StatsQuery(game_id=2)) == []
    assert store.age_group_comparison(me.player_id, StatsQuery(to_date=date(2000, 1, 1))) == []
