from datetime import datetime, timedelta

from internal.models.level_attempt import LevelAttempt

BASE_TIME = datetime(2026, 1, 1, 9, 0)


class FakeLevelAttemptStore:
    def __init__(self):
        self._attempts, self._next_id = {}, 1

    def create(self, play_id, req):
        started_at = req.started_at or BASE_TIME + timedelta(seconds=self._next_id)
        attempt = LevelAttempt(
            self._next_id, play_id, req.level_id, started_at, req.passed, req.duration_ms, req.error_count
        )
        self._attempts[attempt.attempt_id] = attempt
        self._next_id += 1
        return attempt

    def get_by_id(self, attempt_id):
        return self._attempts.get(attempt_id)

    def list_by_play(self, play_id):
        return sorted(
            (a for a in self._attempts.values() if a.play_id == play_id),
            key=lambda a: (a.started_at, a.attempt_id),
        )
