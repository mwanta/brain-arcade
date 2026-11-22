"""Data access for the `session` table."""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.session import Session

_SQL = load_queries(Path(__file__).parent / "sql")


class SessionStore:
    def __init__(self, database):
        self._db = database

    def create(self, player_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["create"], {"player_id": player_id})
            new_id = cur.lastrowid
        return self.get_by_id(new_id)

    def get_by_id(self, session_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["get_by_id"], {"session_id": session_id})
            row = cur.fetchone()
            return Session(**row) if row else None

    def list_by_player(self, player_id):
        """Newest first."""
        with self._db.cursor() as cur:
            cur.execute(_SQL["list_by_player"], {"player_id": player_id})
            return [Session(**row) for row in cur.fetchall()]

    def end(self, session_id):
        """Sets ended_at to now (if not already set) and returns the session."""
        with self._db.cursor() as cur:
            cur.execute(_SQL["end"], {"session_id": session_id})
        return self.get_by_id(session_id)

    def end_at(self, session_id, ended_at):
        """Sets ended_at to the given time (if not already set) and returns the session."""
        with self._db.cursor() as cur:
            cur.execute(_SQL["end_at"], {"session_id": session_id, "ended_at": ended_at})
        return self.get_by_id(session_id)

    def delete_if_empty(self, session_id):
        """Deletes an open session with no check-in and no finished play.

        Returns True if it was deleted.
        """
        with self._db.cursor() as cur:
            cur.execute(_SQL["delete_if_empty"], {"session_id": session_id})
            return cur.rowcount > 0
