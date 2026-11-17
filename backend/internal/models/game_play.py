from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from internal.models.fields import int_field, iso, parse_fields


@dataclass(frozen=True)
class GamePlay:
    play_id: int
    session_id: int
    game_id: int
    started_at: datetime
    finished_at: Optional[datetime]
    score: int  # highest level_number passed, from the game_play_score view

    def to_json(self):
        return {
            "play_id": self.play_id,
            "session_id": self.session_id,
            "game_id": self.game_id,
            "started_at": iso(self.started_at),
            "finished_at": iso(self.finished_at),
            "score": self.score,
        }


@dataclass(frozen=True)
class StartGamePlayRequest:
    session_id: int
    game_id: int

    @classmethod
    def from_json(cls, payload):
        return cls(
            **parse_fields(
                payload,
                {
                    "session_id": int_field(min_value=1),
                    "game_id": int_field(min_value=1),
                },
                required=("session_id", "game_id"),
            )
        )
