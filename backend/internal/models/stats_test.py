from datetime import date, datetime
from decimal import Decimal

import pytest

from internal.errors import ValidationError
from internal.models.stats import (
    AgeGroupComparison,
    CohortComparison,
    CohortQuery,
    ConditionImpact,
    LevelPerformance,
    ScoreBucket,
    StatsQuery,
)


def test_stats_query_defaults_and_parsing():
    assert StatsQuery.from_args({}) == StatsQuery()
    q = StatsQuery.from_args({"from": "2026-11-01", "to": "2026-11-30", "game_id": "2"})
    assert q == StatsQuery(date(2026, 11, 1), date(2026, 11, 30), 2)


def test_stats_query_to_is_inclusive_of_whole_day():
    params = StatsQuery(date(2026, 11, 1), date(2026, 11, 1)).sql_params()
    assert params == {"start": datetime(2026, 11, 1), "end": datetime(2026, 11, 2), "game_id": None}


def test_stats_query_rejects_bad_input():
    with pytest.raises(ValidationError):
        StatsQuery.from_args({"from": "nope"})
    with pytest.raises(ValidationError):
        StatsQuery.from_args({"from": "2026-12-01", "to": "2026-11-01"})


def test_comparison_to_json():
    c = AgeGroupComparison(1, "Sequence Recall", 30, Decimal("2.0000"), Decimal("1.7500"), 4, 0.6667)
    assert c.to_json() == {
        "game_id": 1,
        "game_name": "Sequence Recall",
        "age_group": "30-39",
        "player_avg_score": 2,
        "age_group_avg_score": 1.75,
        "age_group_player_count": 4,
        "percentile": 66.7,
    }


def test_cohort_query_defaults_switch_every_filter_off():
    assert CohortQuery.from_args({}) == CohortQuery()
    params = CohortQuery().sql_params()
    assert params["gender"] is params["occupation"] is params["education_min"] is params["age_min"] is None
    assert params["match"] == ""
    assert (params["min_plays"], params["group_by"], params["max_play_number"]) == (1, "occupation", 10)


def test_cohort_query_parses_lists_bounds_and_matches():
    q = CohortQuery.from_args(
        {
            "occupation": "student,retired",
            "gender": "female",
            "education_min": "bachelor",
            "education_max": "doctorate",
            "age_min": "20",
            "age_max": "39",
            "match": "age_group, education_level",
            "min_plays": "3",
            "group_by": "gender",
        }
    )
    assert q.occupation == ("student", "retired") and q.match == ("age_group", "education_level")
    params = q.sql_params()
    assert params["occupation"] == "student,retired" and params["gender"] == "female"
    assert (params["education_min"], params["education_max"]) == (5, 7)  # ENUM index, 1-based
    assert (params["age_min"], params["age_max"], params["min_plays"]) == (20, 39, 3)
    assert params["match"] == "age_group,education_level" and params["group_by"] == "gender"


@pytest.mark.parametrize(
    "args",
    [
        {"occupation": "pirate"},
        {"match": "height"},
        {"group_by": "username"},
        {"age_min": "40", "age_max": "30"},
        {"education_min": "master", "education_max": "high_school"},
        {"min_plays": "0"},
    ],
)
def test_cohort_query_rejects_bad_input(args):
    with pytest.raises(ValidationError):
        CohortQuery.from_args(args)


def test_cohort_comparison_to_json():
    c = CohortComparison(1, "Sequence Recall", 4, Decimal("1.75"), 2, 8, Decimal("1.5"), 2, 0.857142)
    j = c.to_json()
    assert (j["percentile"], j["player_avg_score"], j["cohort_avg_score"]) == (85.7, 1.75, 1.5)


def test_score_bucket_and_condition_impact_to_json():
    b = ScoreBucket(1, "Sequence Recall", 2, 3, Decimal("0.25"), Decimal("0.625"), 1)
    assert b.to_json()["percentile_low"] == 25 and b.to_json()["percentile_high"] == 62.5
    assert b.to_json()["is_player_best"] is True
    c = ConditionImpact("sleep", "under_6h", Decimal("9"), Decimal("0.5"), Decimal("0"), None)
    assert c.to_json()["peer_avg_completion"] == 50 and c.to_json()["player_avg_completion"] is None


def test_level_performance_from_row_sorts_settings_by_type():
    row = {
        "game_id": 3,
        "game_name": "Quick Match",
        "level_number": 1,
        "settings": '[{"id": 5, "name": "trial_count", "value": 12.0, "unit": "trials"},'
        ' {"id": 2, "name": "time_limit", "value": 2000.0, "unit": "ms"}]',
        "trial_count": Decimal("12.00"),
        "attempts": 2,
        "pass_rate": Decimal("0.5"),
        "avg_errors": Decimal("1.0"),
        "avg_pass_ms": Decimal("6000"),
        "cohort_players": 3,
        "cohort_pass_rate": Decimal("0.75"),
        "cohort_avg_errors": None,
        "cohort_avg_pass_ms": None,
        "pass_rate_percentile": 0.5,
    }
    out = LevelPerformance.from_row(row).to_json()
    assert out["settings"] == [
        {"name": "time_limit", "value": 2000, "unit": "ms"},
        {"name": "trial_count", "value": 12, "unit": "trials"},
    ]
    assert (out["trial_count"], out["pass_rate"], out["cohort_avg_errors"]) == (12, 50.0, None)
