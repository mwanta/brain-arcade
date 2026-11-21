"""Score summaries for a player: history, per-game totals, age-group comparison, and
comparisons with a filtered cohort of similar players."""

from internal.errors import NotFoundError


class StatsHandler:
    def __init__(self, repo):
        self._players = repo.player_store
        self._stats = repo.stats_store

    def score_history(self, player_id, query):
        self._require_player(player_id)
        return self._stats.score_history(player_id, query)

    def game_summaries(self, player_id, query):
        self._require_player(player_id)
        return self._stats.game_summaries(player_id, query)

    def age_group_comparison(self, player_id, query):
        self._require_player(player_id)
        return self._stats.age_group_comparison(player_id, query)

    # ---- cohort queries ----

    def cohort_comparison(self, player_id, query, cohort):
        self._require_player(player_id)
        return self._stats.cohort_comparison(player_id, query, cohort)

    def cohort_distribution(self, player_id, query, cohort):
        self._require_player(player_id)
        return self._stats.cohort_distribution(player_id, query, cohort)

    def demographic_breakdown(self, player_id, query, cohort):
        self._require_player(player_id)
        return self._stats.demographic_breakdown(player_id, query, cohort)

    def learning_curve(self, player_id, query, cohort):
        self._require_player(player_id)
        return self._stats.learning_curve(player_id, query, cohort)

    def condition_impact(self, player_id, query, cohort):
        self._require_player(player_id)
        return self._stats.condition_impact(player_id, query, cohort)

    def level_performance(self, player_id, query, cohort):
        self._require_player(player_id)
        return self._stats.level_performance(player_id, query, cohort)

    def _require_player(self, player_id):
        if self._players.get_by_id(player_id) is None:
            raise NotFoundError(f"Player {player_id} not found")
