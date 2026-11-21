"""Stats SQL against real data. Test players are born in 1930 so their age group
(90s) contains no seed players and the comparison only sees players made here.
Cohort tests pass match=age_group for the same reason."""

from datetime import date

import pytest

from internal.data.check_in_store import CheckInStore
from internal.data.game_play_store import GamePlayStore
from internal.data.level_attempt_store import LevelAttemptStore
from internal.data.level_store import LevelStore
from internal.data.session_store import SessionStore
from internal.data.stats_store import StatsStore
from internal.models.check_in import CreateCheckInRequest
from internal.models.level_attempt import CreateLevelAttemptRequest
from internal.models.stats import CohortQuery, StatsQuery

BIRTHDAY = date(1930, 6, 1)


@pytest.fixture
def play_game(db):
    """play_game(player, passed_levels, finish=True, check_in=None) -> play with that many
    levels passed on game 1, optionally in a session with a check-in."""
    levels = LevelStore(db).list_by_game(1)
    sessions, plays, attempts = SessionStore(db), GamePlayStore(db), LevelAttemptStore(db)

    def play(player, passed_levels, finish=True, check_in=None):
        session = sessions.create(player.player_id)
        if check_in:
            CheckInStore(db).create(session.session_id, check_in)
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


# ---- cohort queries ----------------------------------------------------------

SAME_AGE = CohortQuery(match=("age_group",))


def dec(expected):
    """MySQL returns averages and divisions as DECIMALs rounded to 4 places (div_precision_increment)."""
    return pytest.approx(expected, abs=1e-4)


TIRED, RESTED = CreateCheckInRequest(hours_slept=5), CreateCheckInRequest(hours_slept=9)


@pytest.fixture
def cohort(make_player, play_game):
    """Four players in their 90s, all on game 1 (3 levels). Averages: me 1.5, a 3, b 0, c 1.
    me      female  student  bachelor     scores 2 (tired) then 1 (rested)
    a       male    student  master       scores 3, 3 (rested)
    b       female  retired  high_school  scores 0
    c       female  student  doctorate    scores 1
    """
    me = make_player(BIRTHDAY, "female", "student", "bachelor")
    a = make_player(BIRTHDAY, "male", "student", "master")
    b = make_player(BIRTHDAY, "female", "retired", "high_school")
    c = make_player(BIRTHDAY, "female", "student", "doctorate")
    play_game(me, 2, check_in=TIRED)
    play_game(me, 1, check_in=RESTED)
    play_game(a, 3, check_in=RESTED)
    play_game(a, 3, check_in=RESTED)
    play_game(b, 0)
    play_game(c, 1)
    return me, a, b, c


def test_cohort_comparison(db, cohort):
    [cmp] = StatsStore(db).cohort_comparison(cohort[0].player_id, StatsQuery(), SAME_AGE)
    assert (cmp.cohort_size, cmp.cohort_rank, cmp.plays, cmp.player_best_score) == (4, 2, 2, 2)
    assert float(cmp.cohort_avg_score) == dec((1.5 + 3 + 0 + 1) / 4)
    assert cmp.percentile == pytest.approx(2 / 3)  # beats b and c


def test_cohort_filters_narrow_and_switch(db, cohort):
    store, me = StatsStore(db), cohort[0]

    def size(**filters):
        [cmp] = store.cohort_comparison(
            me.player_id, StatsQuery(), CohortQuery(**{"match": ("age_group",), **filters})
        )
        return cmp.cohort_size

    assert size(occupation=("student",)) == 3
    assert size(occupation=("retired",)) == 2  # me is always in my own cohort
    assert size(match=("age_group", "gender")) == 3
    assert size(match=("age_group", "occupation", "gender")) == 2
    assert size(education_min="master") == 3  # a, c and me
    assert size(education_max="bachelor") == 2  # b and me
    assert size(gender=("male", "female"), occupation=("student", "retired")) == 4
    assert size(min_plays=2) == 2  # b and c played once
    assert size(age_min=0, age_max=20) == 1  # nobody else is that young


def test_cohort_distribution(db, cohort):
    rows = StatsStore(db).cohort_distribution(cohort[0].player_id, StatsQuery(), SAME_AGE)
    assert [(r.score, r.members) for r in rows] == [(0, 1), (1, 1), (2, 1), (3, 1)]
    mine = next(r for r in rows if r.is_player_best)
    assert mine.score == 2
    assert (float(mine.percentile_low), float(mine.percentile_high)) == (0.5, 0.75)


def test_demographic_breakdown(db, cohort):
    store, me = StatsStore(db), cohort[0]
    by_job = store.demographic_breakdown(me.player_id, StatsQuery(), SAME_AGE)
    assert [(g.group_value, g.group_size, g.group_rank) for g in by_job] == [
        ("student", 3, 1),
        ("retired", 1, 2),
    ]
    student = by_job[0]
    assert student.is_player_group and float(student.group_avg_score) == dec((1.5 + 3 + 1) / 3)

    by_edu = store.demographic_breakdown(
        me.player_id, StatsQuery(), CohortQuery(match=("age_group",), group_by="education_level")
    )
    # Ranked by average: a (master) 3, me (bachelor) 1.5, c (doctorate) 1, b (high_school) 0.
    assert [g.group_value for g in by_edu] == ["master", "bachelor", "doctorate", "high_school"]


def test_learning_curve(db, cohort):
    rows = StatsStore(db).learning_curve(cohort[0].player_id, StatsQuery(), SAME_AGE)
    assert [(r.play_number, r.player_score, r.peer_players) for r in rows] == [(1, 2, 3), (2, 1, 1)]
    assert float(rows[0].peer_avg_score) == dec(4 / 3)  # a 3, b 0, c 1
    assert float(rows[1].peer_avg_score) == 3  # only a has a 2nd play


def test_condition_impact(db, cohort):
    rows = StatsStore(db).condition_impact(cohort[0].player_id, StatsQuery(), SAME_AGE)
    sleep = {r.bucket: r for r in rows if r.factor == "sleep"}
    assert set(sleep) == {"under_6h", "8h_plus"}  # b and c have no check-in
    assert float(sleep["under_6h"].player_avg_completion) == dec(2 / 3)
    assert float(sleep["8h_plus"].player_avg_completion) == dec(1 / 3)
    assert int(sleep["8h_plus"].peer_plays) == 2 and float(sleep["8h_plus"].peer_avg_completion) == 1
    assert int(sleep["under_6h"].peer_plays) == 0


def test_level_performance(db, cohort):
    rows = StatsStore(db).level_performance(cohort[0].player_id, StatsQuery(), SAME_AGE)
    assert [(r.level_number, r.attempts, float(r.pass_rate)) for r in rows] == [
        (1, 2, 1),
        (2, 2, 0.5),
        (3, 1, 0),
    ]
    level1 = rows[0]
    assert level1.cohort_players == 4  # b attempted level 1 and failed
    assert float(level1.cohort_pass_rate) == dec(3 / 4)
    assert level1.time_limit_ms is not None and level1.max_errors is not None
    assert rows[2].avg_pass_ms is None  # never passed level 3
