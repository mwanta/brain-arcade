"""Pre-session check-in: sleep, caffeine, stress, exercise. All fields are optional."""

from dataclasses import dataclass
from typing import Optional

from internal.models.fields import bool_field, int_field, number, number_field, parse_fields


@dataclass(frozen=True)
class CheckIn:
    check_in_id: int
    session_id: int
    hours_slept: Optional[float]
    caffeine_drinks: Optional[int]
    stress_level: Optional[int]
    exercised_today: Optional[bool]

    def to_json(self):
        return {
            "check_in_id": self.check_in_id,
            "session_id": self.session_id,
            "hours_slept": number(self.hours_slept, places=1),
            "caffeine_drinks": self.caffeine_drinks,
            "stress_level": self.stress_level,
            "exercised_today": None if self.exercised_today is None else bool(self.exercised_today),
        }


@dataclass(frozen=True)
class CreateCheckInRequest:
    hours_slept: Optional[float] = None
    caffeine_drinks: Optional[int] = None
    stress_level: Optional[int] = None
    exercised_today: Optional[bool] = None

    @classmethod
    def from_json(cls, payload):
        return cls(
            **parse_fields(
                payload,
                {
                    "hours_slept": number_field(min_value=0, max_value=24),
                    "caffeine_drinks": int_field(min_value=0),
                    "stress_level": int_field(min_value=1, max_value=5),
                    "exercised_today": bool_field(),
                },
            )
        )
