"""Data access for the `game` table (read-only catalog)."""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.game import Game

_SQL = load_queries(Path(__file__).parent / "sql")


class GameStore:
    def __init__(self, database):
        self._db = database

    def list_all(self):
        with self._db.cursor() as cur:
            cur.execute(_SQL["list_all"])
            return [Game(**row) for row in cur.fetchall()]

    def get_by_id(self, game_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["get_by_id"], {"game_id": game_id})
            row = cur.fetchone()
            return Game(**row) if row else None
