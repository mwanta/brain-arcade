class FakeStatsStore:
    """Returns canned results and records the last call, for handler/route tests."""

    def __init__(self, history=(), summaries=(), comparisons=()):
        self._history, self._summaries, self._comparisons = list(history), list(summaries), list(comparisons)
        self.last_call = None

    def score_history(self, player_id, query):
        self.last_call = ("score_history", player_id, query)
        return self._history

    def game_summaries(self, player_id, query):
        self.last_call = ("game_summaries", player_id, query)
        return self._summaries

    def age_group_comparison(self, player_id, query):
        self.last_call = ("age_group_comparison", player_id, query)
        return self._comparisons
