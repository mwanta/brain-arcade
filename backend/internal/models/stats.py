"""Models for score summaries: history over time, per-game totals, age-group comparison.

Only finished game plays count toward stats.
"""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional

from internal.errors import ValidationError
from internal.models.fields import date_field, int_field, iso, number, parse_fields


@dataclass(frozen=True)
class StatsQuery:
    """Filters from the query string: ?from=YYYY-MM-DD&to=YYYY-MM-DD&game_id=N (all optional).
    `to` is inclusive of that whole day."""

    from_date: Optional[date] = None
    to_date: Optional[date] = None
    game_id: Optional[int] = None

    @classmethod
    def from_args(cls, args):
        values = parse_fields(
            dict(args), {"from": date_field(), "to": date_field(), "game_id": int_field(min_value=1)}
        )
        if values["from"] and values["to"] and values["from"] > values["to"]:
            raise ValidationError("Invalid data", {"to": "Must be on or after 'from'"})
        return cls(values["from"], values["to"], values["game_id"])

    def sql_params(self):
        """Half-open datetime range [start, end) for comparing against started_at."""
        return {
            "start": datetime.combine(self.from_date, datetime.min.time()) if self.from_date else None,
            "end": datetime.combine(self.to_date + timedelta(days=1), datetime.min.time())
            if self.to_date
            else None,
            "game_id": self.game_id,
        }


@dataclass(frozen=True)
class ScoreHistoryEntry:
    play_id: int
    game_id: int
    game_name: str
    started_at: datetime
    finished_at: datetime
    score: int

    def to_json(self):
        return {
            "play_id": self.play_id,
            "game_id": self.game_id,
            "game_name": self.game_name,
            "started_at": iso(self.started_at),
            "finished_at": iso(self.finished_at),
            "score": self.score,
        }


@dataclass(frozen=True)
class GameSummary:
    game_id: int
    game_name: str
    domain_name: str
    plays: int
    best_score: int
    avg_score: float
    last_played_at: datetime

    def to_json(self):
        return {
            "game_id": self.game_id,
            "game_name": self.game_name,
            "domain_name": self.domain_name,
            "plays": self.plays,
            "best_score": self.best_score,
            "avg_score": number(self.avg_score),
            "last_played_at": iso(self.last_played_at),
        }


@dataclass(frozen=True)
class AgeGroupComparison:
    """How a player's average score on one game compares with players in the same age
    decade (e.g. 20-29) who played that game in the same period.

    `percentile` is the percentage of the other players in the group whose average is
    lower than this player's (0 if the player is alone in the group).
    """

    game_id: int
    game_name: str
    age_group_start: int
    player_avg_score: float
    age_group_avg_score: float
    age_group_player_count: int
    percentile: float

    def to_json(self):
        return {
            "game_id": self.game_id,
            "game_name": self.game_name,
            "age_group": f"{self.age_group_start}-{self.age_group_start + 9}",
            "player_avg_score": number(self.player_avg_score),
            "age_group_avg_score": number(self.age_group_avg_score),
            "age_group_player_count": self.age_group_player_count,
            "percentile": number(self.percentile * 100, places=1),
        }
