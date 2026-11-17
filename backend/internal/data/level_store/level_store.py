"""Data access for the `level` table (read-only catalog).

Returned levels have empty `settings`; handlers attach them from LevelSettingStore.
"""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.game import Level

_SQL = load_queries(Path(__file__).parent / "sql")


class LevelStore:
    def __init__(self, database):
        self._db = database

    def list_by_game(self, game_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["list_by_game"], {"game_id": game_id})
            return [Level(**row) for row in cur.fetchall()]

    def get_by_id(self, level_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["get_by_id"], {"level_id": level_id})
            row = cur.fetchone()
            return Level(**row) if row else None
