"""Read-only cross-table queries for score summaries.

Unlike the per-table stores this one joins across tables, so reporting queries live
in one place. Only finished game plays are counted.

The cohort methods also take a CohortQuery saying which players to compare with. They
first CALL the load_cohort procedure (schema.sql), which applies the filters and fills
temporary tables, then run their own query over those tables on the same connection.
"""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.stats import (
    AgeGroupComparison,
    CohortComparison,
    ConditionImpact,
    DemographicGroup,
    GameSummary,
    LearningCurvePoint,
    LevelPerformance,
    ScoreBucket,
    ScoreHistoryEntry,
)

_SQL = load_queries(Path(__file__).parent / "sql")


class StatsStore:
    def __init__(self, database):
        self._db = database

    def score_history(self, player_id, query):
        return [ScoreHistoryEntry(**row) for row in self._fetch("score_history", player_id, query)]

    def game_summaries(self, player_id, query):
        return [GameSummary(**row) for row in self._fetch("game_summaries", player_id, query)]

    def age_group_comparison(self, player_id, query):
        return [AgeGroupComparison(**row) for row in self._fetch("age_group_comparison", player_id, query)]

    # ---- cohort queries: (player_id, StatsQuery, CohortQuery) ----

    def cohort_comparison(self, player_id, query, cohort):
        return [
            CohortComparison(**r) for r in self._fetch_cohort("cohort_comparison", player_id, query, cohort)
        ]

    def cohort_distribution(self, player_id, query, cohort):
        return [ScoreBucket(**r) for r in self._fetch_cohort("cohort_distribution", player_id, query, cohort)]

    def demographic_breakdown(self, player_id, query, cohort):
        return [
            DemographicGroup(**r)
            for r in self._fetch_cohort("demographic_breakdown", player_id, query, cohort)
        ]

    def learning_curve(self, player_id, query, cohort):
        return [
            LearningCurvePoint(**r) for r in self._fetch_cohort("learning_curve", player_id, query, cohort)
        ]

    def condition_impact(self, player_id, query, cohort):
        return [
            ConditionImpact(**r) for r in self._fetch_cohort("condition_impact", player_id, query, cohort)
        ]

    def level_performance(self, player_id, query, cohort):
        return [
            LevelPerformance(**r) for r in self._fetch_cohort("level_performance", player_id, query, cohort)
        ]

    def _fetch(self, name, player_id, query):
        with self._db.cursor() as cur:
            cur.execute(_SQL[name], {"player_id": player_id, **query.sql_params()})
            return cur.fetchall()

    def _fetch_cohort(self, name, player_id, query, cohort):
        params = {"player_id": player_id, **query.sql_params(), **cohort.sql_params()}
        with self._db.cursor() as cur:  # one connection, so the temporary tables are visible
            cur.execute(_SQL["load_cohort"], params)
            cur.execute(_SQL[name], params)
            return cur.fetchall()
