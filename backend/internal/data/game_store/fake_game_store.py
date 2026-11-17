class FakeGameStore:
    def __init__(self, games=()):
        self._games = {g.game_id: g for g in games}

    def list_all(self):
        return sorted(self._games.values(), key=lambda g: g.name)

    def get_by_id(self, game_id):
        return self._games.get(game_id)
