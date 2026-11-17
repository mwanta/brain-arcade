"""Read-only cross-table queries for score summaries.

Unlike the per-table stores this one joins across tables, so reporting queries live
in one place. Only finished game plays are counted.
"""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.stats import AgeGroupComparison, GameSummary, ScoreHistoryEntry

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

    def _fetch(self, name, player_id, query):
        with self._db.cursor() as cur:
            cur.execute(_SQL[name], {"player_id": player_id, **query.sql_params()})
            return cur.fetchall()
