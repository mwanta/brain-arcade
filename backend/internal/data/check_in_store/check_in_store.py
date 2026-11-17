"""Data access for the `check_in` table (at most one per session)."""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.check_in import CheckIn

_SQL = load_queries(Path(__file__).parent / "sql")


class CheckInStore:
    def __init__(self, database):
        self._db = database

    def create(self, session_id, req):
        """Raises DuplicateKeyError if the session already has a check-in."""
        with self._db.cursor() as cur:
            cur.execute(
                _SQL["create"],
                {
                    "session_id": session_id,
                    "hours_slept": req.hours_slept,
                    "caffeine_drinks": req.caffeine_drinks,
                    "stress_level": req.stress_level,
                    "exercised_today": req.exercised_today,
                },
            )
        return self.get_by_session(session_id)

    def get_by_session(self, session_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["get_by_session"], {"session_id": session_id})
            row = cur.fetchone()
            return CheckIn(**row) if row else None
