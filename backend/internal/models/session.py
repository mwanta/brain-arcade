from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from internal.models.fields import int_field, iso, parse_fields


@dataclass(frozen=True)
class Session:
    session_id: int
    player_id: int
    started_at: datetime
    ended_at: Optional[datetime]

    def to_json(self):
        return {
            "session_id": self.session_id,
            "player_id": self.player_id,
            "started_at": iso(self.started_at),
            "ended_at": iso(self.ended_at),
        }


@dataclass(frozen=True)
class StartSessionRequest:
    player_id: int

    @classmethod
    def from_json(cls, payload):
        return cls(**parse_fields(payload, {"player_id": int_field(min_value=1)}, required=("player_id",)))
