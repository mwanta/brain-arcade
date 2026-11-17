class FakeLevelSettingStore:
    def __init__(self, settings_by_game=None):
        """`settings_by_game`: {game_id: [LevelSetting, ...]}"""
        self._by_game = settings_by_game or {}

    def list_by_game(self, game_id):
        return list(self._by_game.get(game_id, []))
