from datetime import date, datetime
from decimal import Decimal

import pytest

from internal.errors import ValidationError
from internal.models.stats import AgeGroupComparison, StatsQuery


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
