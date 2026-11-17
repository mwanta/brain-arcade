"""Read-only game catalog: domains, setting types, games with their levels and settings."""

from collections import defaultdict
from dataclasses import replace

from internal.errors import NotFoundError
from internal.models.game import GameDetail


class CatalogHandler:
    def __init__(self, repo):
        self._domains = repo.cognitive_domain_store
        self._setting_types = repo.setting_type_store
        self._games = repo.game_store
        self._levels = repo.level_store
        self._level_settings = repo.level_setting_store

    def list_domains(self):
        return self._domains.list_all()

    def list_setting_types(self):
        return self._setting_types.list_all()

    def list_games(self):
        return self._games.list_all()

    def get_game(self, game_id):
        """The game plus its levels, each with a {setting name: value} dict."""
        game = self._games.get_by_id(game_id)
        if game is None:
            raise NotFoundError(f"Game {game_id} not found")
        settings = defaultdict(dict)
        for s in self._level_settings.list_by_game(game_id):
            settings[s.level_id][s.name] = s.value
        levels = [replace(lvl, settings=settings[lvl.level_id]) for lvl in self._levels.list_by_game(game_id)]
        return GameDetail(game, levels)
