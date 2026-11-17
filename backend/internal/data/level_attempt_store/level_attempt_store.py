"""Data access for the `level_attempt` table."""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.level_attempt import LevelAttempt

_SQL = load_queries(Path(__file__).parent / "sql")


class LevelAttemptStore:
    def __init__(self, database):
        self._db = database

    def create(self, play_id, req):
        """Inserts a CreateLevelAttemptRequest. started_at defaults to now when not given."""
        with self._db.cursor() as cur:
            cur.execute(
                _SQL["create"],
                {
                    "play_id": play_id,
                    "level_id": req.level_id,
                    "started_at": req.started_at,
                    "passed": req.passed,
                    "duration_ms": req.duration_ms,
                    "error_count": req.error_count,
                },
            )
            new_id = cur.lastrowid
        return self.get_by_id(new_id)

    def get_by_id(self, attempt_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["get_by_id"], {"attempt_id": attempt_id})
            row = cur.fetchone()
            return LevelAttempt(**row) if row else None

    def list_by_play(self, play_id):
        """In the order they were attempted."""
        with self._db.cursor() as cur:
            cur.execute(_SQL["list_by_play"], {"play_id": play_id})
            return [LevelAttempt(**row) for row in cur.fetchall()]
