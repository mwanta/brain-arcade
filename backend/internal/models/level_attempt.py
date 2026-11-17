from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from internal.models.fields import bool_field, datetime_field, int_field, iso, parse_fields


@dataclass(frozen=True)
class LevelAttempt:
    attempt_id: int
    play_id: int
    level_id: int
    started_at: datetime
    passed: bool
    duration_ms: Optional[int]
    error_count: Optional[int]

    def to_json(self):
        return {
            "attempt_id": self.attempt_id,
            "play_id": self.play_id,
            "level_id": self.level_id,
            "started_at": iso(self.started_at),
            "passed": bool(self.passed),
            "duration_ms": self.duration_ms,
            "error_count": self.error_count,
        }


@dataclass(frozen=True)
class CreateLevelAttemptRequest:
    """`passed` is decided by the game (against the level's settings) and sent as-is.
    `started_at` defaults to the server's current time when omitted."""

    level_id: int
    passed: bool
    duration_ms: Optional[int] = None
    error_count: Optional[int] = None
    started_at: Optional[datetime] = None

    @classmethod
    def from_json(cls, payload):
        return cls(
            **parse_fields(
                payload,
                {
                    "level_id": int_field(min_value=1),
                    "passed": bool_field(),
                    "duration_ms": int_field(min_value=0),
                    "error_count": int_field(min_value=0),
                    "started_at": datetime_field(),
                },
                required=("level_id", "passed"),
            )
        )
