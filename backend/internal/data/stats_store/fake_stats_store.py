class FakeStatsStore:
    """Returns canned results and records the last call, for handler/route tests.

    `cohort_results` maps a cohort method name (e.g. "learning_curve") to the rows it returns.
    """

    def __init__(self, history=(), summaries=(), comparisons=(), cohort_results=None):
        self._history, self._summaries, self._comparisons = list(history), list(summaries), list(comparisons)
        self._cohort_results = dict(cohort_results or {})
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

    def cohort_comparison(self, player_id, query, cohort):
        return self._cohort("cohort_comparison", player_id, query, cohort)

    def cohort_distribution(self, player_id, query, cohort):
        return self._cohort("cohort_distribution", player_id, query, cohort)

    def demographic_breakdown(self, player_id, query, cohort):
        return self._cohort("demographic_breakdown", player_id, query, cohort)

    def learning_curve(self, player_id, query, cohort):
        return self._cohort("learning_curve", player_id, query, cohort)

    def condition_impact(self, player_id, query, cohort):
        return self._cohort("condition_impact", player_id, query, cohort)

    def level_performance(self, player_id, query, cohort):
        return self._cohort("level_performance", player_id, query, cohort)

    def _cohort(self, name, player_id, query, cohort):
        self.last_call = (name, player_id, query, cohort)
        return list(self._cohort_results.get(name, ()))
