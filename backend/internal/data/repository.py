"""Groups every store into one object that handlers receive.

Add a field here for each new store and build it in `from_database`. Fields default
to None so tests only pass the fakes they need:
    Repository(player_store=FakePlayerStore(), session_store=FakeSessionStore())
"""

from dataclasses import dataclass
from typing import Optional

from internal.data.check_in_store import CheckInStore
from internal.data.cognitive_domain_store import CognitiveDomainStore
from internal.data.game_play_store import GamePlayStore
from internal.data.game_store import GameStore
from internal.data.level_attempt_store import LevelAttemptStore
from internal.data.level_setting_store import LevelSettingStore
from internal.data.level_store import LevelStore
from internal.data.player_store import PlayerStore
from internal.data.session_store import SessionStore
from internal.data.setting_type_store import SettingTypeStore
from internal.data.stats_store import StatsStore


@dataclass(frozen=True)
class Repository:
    # players and their activity
    player_store: Optional[PlayerStore] = None
    session_store: Optional[SessionStore] = None
    check_in_store: Optional[CheckInStore] = None
    game_play_store: Optional[GamePlayStore] = None
    level_attempt_store: Optional[LevelAttemptStore] = None
    # game catalog (read-only)
    cognitive_domain_store: Optional[CognitiveDomainStore] = None
    game_store: Optional[GameStore] = None
    level_store: Optional[LevelStore] = None
    level_setting_store: Optional[LevelSettingStore] = None
    setting_type_store: Optional[SettingTypeStore] = None
    # cross-table reporting queries
    stats_store: Optional[StatsStore] = None

    @classmethod
    def from_database(cls, database):
        """Builds every real store on one shared Database."""
        return cls(
            player_store=PlayerStore(database),
            session_store=SessionStore(database),
            check_in_store=CheckInStore(database),
            game_play_store=GamePlayStore(database),
            level_attempt_store=LevelAttemptStore(database),
            cognitive_domain_store=CognitiveDomainStore(database),
            game_store=GameStore(database),
            level_store=LevelStore(database),
            level_setting_store=LevelSettingStore(database),
            setting_type_store=SettingTypeStore(database),
            stats_store=StatsStore(database),
        )
