"""Game catalog models: games, their levels, and each level's settings."""

from dataclasses import dataclass, field
from typing import Optional

from internal.models.fields import number


@dataclass(frozen=True)
class Game:
    game_id: int
    domain_id: int
    domain_name: str
    name: str
    instructions: Optional[str]

    def to_json(self):
        return {
            "game_id": self.game_id,
            "domain_id": self.domain_id,
            "domain_name": self.domain_name,
            "name": self.name,
            "instructions": self.instructions,
        }


@dataclass(frozen=True)
class Level:
    level_id: int
    game_id: int
    level_number: int
    settings: dict = field(default_factory=dict)  # setting name -> value, e.g. {"time_limit": 5000}

    def to_json(self):
        return {
            "level_id": self.level_id,
            "game_id": self.game_id,
            "level_number": self.level_number,
            "settings": {name: number(value) for name, value in self.settings.items()},
        }


@dataclass(frozen=True)
class LevelSetting:
    level_id: int
    name: str
    value: float


@dataclass(frozen=True)
class GameDetail:
    """A game with its levels (in level_number order), as returned by GET /api/games/<id>."""

    game: Game
    levels: list

    def to_json(self):
        return {**self.game.to_json(), "levels": [lvl.to_json() for lvl in self.levels]}
