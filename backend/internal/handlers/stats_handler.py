"""Score summaries for a player: history, per-game totals, age-group comparison."""

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

    def _require_player(self, player_id):
        if self._players.get_by_id(player_id) is None:
            raise NotFoundError(f"Player {player_id} not found")
