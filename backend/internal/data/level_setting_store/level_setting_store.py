"""Data access for the `level_setting` table (read-only catalog)."""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.game import LevelSetting

_SQL = load_queries(Path(__file__).parent / "sql")


class LevelSettingStore:
    def __init__(self, database):
        self._db = database

    def list_by_game(self, game_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["list_by_game"], {"game_id": game_id})
            return [LevelSetting(**row) for row in cur.fetchall()]
