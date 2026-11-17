"""Data access for the `game_play` table. Scores come from the game_play_score view."""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.game_play import GamePlay

_SQL = load_queries(Path(__file__).parent / "sql")


class GamePlayStore:
    def __init__(self, database):
        self._db = database

    def create(self, session_id, game_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["create"], {"session_id": session_id, "game_id": game_id})
            new_id = cur.lastrowid
        return self.get_by_id(new_id)

    def get_by_id(self, play_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["get_by_id"], {"play_id": play_id})
            row = cur.fetchone()
            return GamePlay(**row) if row else None

    def list_by_session(self, session_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["list_by_session"], {"session_id": session_id})
            return [GamePlay(**row) for row in cur.fetchall()]

    def finish(self, play_id):
        """Sets finished_at to now (if not already set) and returns the play."""
        with self._db.cursor() as cur:
            cur.execute(_SQL["finish"], {"play_id": play_id})
        return self.get_by_id(play_id)
