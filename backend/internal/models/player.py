"""Player models: the shapes that cross the API boundary.

Routes parse incoming JSON into request models (which validate format) and
serialize outgoing `Player` models back to JSON. Handlers and the data layer
only ever see these typed objects, never raw dicts from the request.
"""

import re
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

from internal.errors import ValidationError

GENDERS = ("female", "male", "non_binary", "other", "prefer_not_to_say")
OCCUPATIONS = (
    "student",
    "technology",
    "healthcare",
    "education",
    "business",
    "trades",
    "arts_media",
    "service",
    "retired",
    "unemployed",
    "other",
)
# Lowest to highest, matching the ENUM order in schema.sql (the stats queries rely on it).
EDUCATION_LEVELS = (
    "less_than_high_school",
    "high_school",
    "some_college",
    "associate",
    "bachelor",
    "master",
    "doctorate",
)
UPDATABLE_FIELDS = ("username", "birthday", "gender", "occupation", "education_level")
_SERVER_ASSIGNED = ("player_id", "created_at", "updated_at")
_USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]{3,50}$")


@dataclass(frozen=True)
class Player:
    player_id: int
    username: str
    birthday: date
    gender: Optional[str]
    occupation: Optional[str]
    education_level: Optional[str]
    created_at: datetime
    updated_at: datetime

    def to_json(self):
        return {
            "player_id": self.player_id,
            "username": self.username,
            "birthday": self.birthday.isoformat(),
            "gender": self.gender,
            "occupation": self.occupation,
            "education_level": self.education_level,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


@dataclass(frozen=True)
class CreatePlayerRequest:
    username: str
    birthday: date
    gender: Optional[str] = None
    occupation: Optional[str] = None
    education_level: Optional[str] = None

    @classmethod
    def from_json(cls, payload):
        return cls(**_parse(payload, required=True))


@dataclass(frozen=True)
class UpdatePlayerRequest:
    """Partial update: only fields present in the payload are changed."""

    username: Optional[str] = None
    birthday: Optional[date] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    education_level: Optional[str] = None
    fields_set: frozenset = field(default_factory=frozenset)

    @classmethod
    def from_json(cls, payload):
        values = _parse(payload, required=False)
        return cls(**values, fields_set=frozenset(values))

    def changes(self):
        """Dict of only the fields the client provided."""
        return {name: getattr(self, name) for name in UPDATABLE_FIELDS if name in self.fields_set}


@dataclass(frozen=True)
class LoginRequest:
    """Log in by username alone (there are no passwords)."""

    username: str

    @classmethod
    def from_json(cls, payload):
        if not isinstance(payload, dict):
            raise ValidationError("Request body must be a JSON object")
        username = payload.get("username")
        username = username.strip() if isinstance(username, str) else ""
        if not username:
            raise ValidationError("Invalid login", {"username": "Required"})
        return cls(username)


# ---- parsing helpers --------------------------------------------------------


def _parse(payload, required):
    """Validates field formats. With required=False, only provided fields are returned."""
    if not isinstance(payload, dict):
        raise ValidationError("Request body must be a JSON object")

    errors, values = {}, {}
    for name, parser in (
        ("username", _parse_username),
        ("birthday", _parse_birthday),
        ("gender", _parse_gender),
        ("occupation", _parse_occupation),
        ("education_level", _parse_education_level),
    ):
        if required or name in payload:
            try:
                values[name] = parser(payload.get(name))
            except ValueError as exc:
                errors[name] = str(exc)

    for name in _SERVER_ASSIGNED:
        if name in payload:
            errors[name] = "Cannot be set"

    if errors:
        raise ValidationError("Invalid player data", errors)
    return values


def _parse_username(raw):
    username = (raw or "").strip() if isinstance(raw, (str, type(None))) else ""
    if not _USERNAME_RE.match(username):
        raise ValueError("Must be 3-50 characters: letters, numbers, _ . -")
    return username


def _parse_birthday(raw):
    if raw in (None, ""):
        raise ValueError("Required")
    try:
        bday = date.fromisoformat(raw)
    except (TypeError, ValueError):
        raise ValueError("Must be a date in YYYY-MM-DD format")
    if bday > date.today():
        raise ValueError("Cannot be in the future")
    return bday


def _parse_gender(raw):
    return _parse_choice(raw, GENDERS)


def _parse_occupation(raw):
    return _parse_choice(raw, OCCUPATIONS)


def _parse_education_level(raw):
    return _parse_choice(raw, EDUCATION_LEVELS)


def _parse_choice(raw, choices):
    """Optional value from a fixed list (an ENUM column); empty means NULL."""
    if raw in (None, ""):
        return None
    if raw not in choices:
        raise ValueError(f"Must be one of: {', '.join(choices)}")
    return raw
