"""Models for score summaries: history over time, per-game totals, age-group comparison,
and the cohort queries that compare a player with players like them.

Only finished game plays count toward stats.
"""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional

from internal.errors import ValidationError
from internal.models.fields import (
    choice_field,
    choice_list_field,
    date_field,
    int_field,
    iso,
    number,
    parse_fields,
)
from internal.models.player import EDUCATION_LEVELS, GENDERS, OCCUPATIONS


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


# ---- cohort queries ----------------------------------------------------------

# Attributes a cohort can be matched or grouped on.
COHORT_ATTRIBUTES = ("age_group", "gender", "occupation", "education_level")


@dataclass(frozen=True)
class CohortQuery:
    """Who the player is compared with. Every filter is optional and they combine with AND;
    with none set, the cohort is every player. The player is always part of their own cohort.

    Query string (lists are comma-separated):
        gender, occupation, education_level   allow-lists, e.g. occupation=student,retired
        education_min, education_max          e.g. education_min=bachelor (inclusive)
        age_min, age_max                      current age in years (inclusive)
        match                                 same value as the player, e.g. match=age_group,occupation
        min_plays                             plays of a game a member needs to count (default 1)
        group_by                              breakdown only: one of COHORT_ATTRIBUTES (default occupation)
        max_play_number                       learning curve only: plays to show (default 10)
    """

    gender: tuple = ()
    occupation: tuple = ()
    education_level: tuple = ()
    education_min: Optional[str] = None
    education_max: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    match: tuple = ()
    min_plays: int = 1
    group_by: str = "occupation"
    max_play_number: int = 10

    @classmethod
    def from_args(cls, args):
        v = parse_fields(
            dict(args),
            {
                "gender": choice_list_field(GENDERS),
                "occupation": choice_list_field(OCCUPATIONS),
                "education_level": choice_list_field(EDUCATION_LEVELS),
                "education_min": choice_field(EDUCATION_LEVELS),
                "education_max": choice_field(EDUCATION_LEVELS),
                "age_min": int_field(min_value=0, max_value=150),
                "age_max": int_field(min_value=0, max_value=150),
                "match": choice_list_field(COHORT_ATTRIBUTES),
                "min_plays": int_field(min_value=1),
                "group_by": choice_field(COHORT_ATTRIBUTES),
                "max_play_number": int_field(min_value=1, max_value=100),
            },
        )
        errors = {}
        if v["age_min"] is not None and v["age_max"] is not None and v["age_min"] > v["age_max"]:
            errors["age_max"] = "Must be at least age_min"
        if (
            v["education_min"]
            and v["education_max"]
            and EDUCATION_LEVELS.index(v["education_min"]) > EDUCATION_LEVELS.index(v["education_max"])
        ):
            errors["education_max"] = "Must be at or above education_min"
        if errors:
            raise ValidationError("Invalid data", errors)
        defaults = cls()
        return cls(
            gender=v["gender"] or (),
            occupation=v["occupation"] or (),
            education_level=v["education_level"] or (),
            education_min=v["education_min"],
            education_max=v["education_max"],
            age_min=v["age_min"],
            age_max=v["age_max"],
            match=v["match"] or (),
            min_plays=v["min_plays"] or defaults.min_plays,
            group_by=v["group_by"] or defaults.group_by,
            max_play_number=v["max_play_number"] or defaults.max_play_number,
        )

    def sql_params(self):
        """Parameters for the load_cohort procedure. Lists become comma-separated strings
        (None when unused; match is '' when unused). Education bounds become the ENUM's
        1-based index."""

        def as_set(values):
            return ",".join(values) if values else None

        def education_index(level):
            return EDUCATION_LEVELS.index(level) + 1 if level else None

        return {
            "gender": as_set(self.gender),
            "occupation": as_set(self.occupation),
            "education_level": as_set(self.education_level),
            "education_min": education_index(self.education_min),
            "education_max": education_index(self.education_max),
            "age_min": self.age_min,
            "age_max": self.age_max,
            "match": ",".join(self.match),
            "min_plays": self.min_plays,
            "group_by": self.group_by,
            "max_play_number": self.max_play_number,
        }


def _percent(fraction):
    """A 0-1 fraction from SQL -> a percentage with one decimal place."""
    return None if fraction is None else number(float(fraction) * 100, places=1)


@dataclass(frozen=True)
class CohortComparison:
    """One game: the player's average against their cohort's. `percentile` is the
    percentage of other members with a lower average."""

    game_id: int
    game_name: str
    plays: int
    player_avg_score: float
    player_best_score: int
    cohort_size: int
    cohort_avg_score: float
    cohort_rank: int
    percentile: float

    def to_json(self):
        return {
            "game_id": self.game_id,
            "game_name": self.game_name,
            "plays": self.plays,
            "player_avg_score": number(self.player_avg_score),
            "player_best_score": self.player_best_score,
            "cohort_size": self.cohort_size,
            "cohort_avg_score": number(self.cohort_avg_score),
            "cohort_rank": self.cohort_rank,
            "percentile": _percent(self.percentile),
        }


@dataclass(frozen=True)
class ScoreBucket:
    """One best score on one game: how many members have it, and the percentile range
    (percentile_low to percentile_high) it covers. Scores nobody reached are left out."""

    game_id: int
    game_name: str
    score: int
    members: int
    percentile_low: float
    percentile_high: float
    is_player_best: bool

    def to_json(self):
        return {
            "game_id": self.game_id,
            "game_name": self.game_name,
            "score": self.score,
            "members": self.members,
            "percentile_low": _percent(self.percentile_low),
            "percentile_high": _percent(self.percentile_high),
            "is_player_best": bool(self.is_player_best),
        }


@dataclass(frozen=True)
class DemographicGroup:
    """One group of the cohort (e.g. occupation = "student") on one game, ranked by average."""

    game_id: int
    game_name: str
    group_value: str
    group_size: int
    group_avg_score: float
    group_rank: int
    is_player_group: bool

    def to_json(self):
        return {
            "game_id": self.game_id,
            "game_name": self.game_name,
            "group": self.group_value,
            "group_size": self.group_size,
            "group_avg_score": number(self.group_avg_score),
            "group_rank": self.group_rank,
            "is_player_group": bool(self.is_player_group),
        }


@dataclass(frozen=True)
class LearningCurvePoint:
    """The player's Nth play of a game next to their peers' Nth plays. player_score is
    None past the player's own number of plays."""

    game_id: int
    game_name: str
    play_number: int
    player_score: Optional[int]
    peer_avg_score: Optional[float]
    peer_players: int

    def to_json(self):
        return {
            "game_id": self.game_id,
            "game_name": self.game_name,
            "play_number": self.play_number,
            "player_score": self.player_score,
            "peer_avg_score": number(self.peer_avg_score),
            "peer_players": int(self.peer_players),
        }


@dataclass(frozen=True)
class ConditionImpact:
    """Average completion (percentage of a game's levels passed) for one check-in bucket,
    e.g. factor "sleep", bucket "under_6h"."""

    factor: str
    bucket: str
    peer_plays: int
    peer_avg_completion: Optional[float]
    player_plays: int
    player_avg_completion: Optional[float]

    def to_json(self):
        return {
            "factor": self.factor,
            "bucket": self.bucket,
            "peer_plays": int(self.peer_plays),
            "peer_avg_completion": _percent(self.peer_avg_completion),
            "player_plays": int(self.player_plays),
            "player_avg_completion": _percent(self.player_avg_completion),
        }


@dataclass(frozen=True)
class LevelPerformance:
    """The player's attempts at one level against the cohort's. avg_pass_ms only counts
    passed attempts; pass_rate_percentile is the percentage of members with a lower pass rate."""

    game_id: int
    game_name: str
    level_number: int
    time_limit_ms: Optional[float]
    max_errors: Optional[float]
    attempts: int
    pass_rate: float
    avg_pass_ms: Optional[float]
    cohort_players: int
    cohort_pass_rate: float
    cohort_avg_pass_ms: Optional[float]
    pass_rate_percentile: float

    def to_json(self):
        return {
            "game_id": self.game_id,
            "game_name": self.game_name,
            "level_number": self.level_number,
            "time_limit_ms": number(self.time_limit_ms),
            "max_errors": number(self.max_errors),
            "attempts": self.attempts,
            "pass_rate": _percent(self.pass_rate),
            "avg_pass_ms": number(self.avg_pass_ms),
            "cohort_players": self.cohort_players,
            "cohort_pass_rate": _percent(self.cohort_pass_rate),
            "cohort_avg_pass_ms": number(self.cohort_avg_pass_ms),
            "pass_rate_percentile": _percent(self.pass_rate_percentile),
        }
