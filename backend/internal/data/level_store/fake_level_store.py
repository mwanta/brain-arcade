class FakeLevelStore:
    def __init__(self, levels=()):
        self._levels = {lvl.level_id: lvl for lvl in levels}

    def list_by_game(self, game_id):
        return sorted(
            (lvl for lvl in self._levels.values() if lvl.game_id == game_id), key=lambda lvl: lvl.level_number
        )

    def get_by_id(self, level_id):
        return self._levels.get(level_id)
