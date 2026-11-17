"""Shared pytest fixtures for handler and route tests (fake stores, no MySQL)."""

from datetime import date
from decimal import Decimal

import pytest

from internal.data.check_in_store.fake_check_in_store import FakeCheckInStore
from internal.data.cognitive_domain_store.fake_cognitive_domain_store import FakeCognitiveDomainStore
from internal.data.game_play_store.fake_game_play_store import FakeGamePlayStore
from internal.data.game_store.fake_game_store import FakeGameStore
from internal.data.level_attempt_store.fake_level_attempt_store import FakeLevelAttemptStore
from internal.data.level_setting_store.fake_level_setting_store import FakeLevelSettingStore
from internal.data.level_store.fake_level_store import FakeLevelStore
from internal.data.player_store.fake_player_store import FakePlayerStore
from internal.data.repository import Repository
from internal.data.session_store.fake_session_store import FakeSessionStore
from internal.data.setting_type_store.fake_setting_type_store import FakeSettingTypeStore
from internal.data.stats_store.fake_stats_store import FakeStatsStore
from internal.models.cognitive_domain import CognitiveDomain
from internal.models.game import Game, Level, LevelSetting
from internal.models.player import CreatePlayerRequest
from internal.models.setting_type import SettingType

# Small catalog: game 1 has levels 1-2, game 2 has level 3.
DOMAINS = [CognitiveDomain(1, "memory", None), CognitiveDomain(2, "attention", None)]
SETTING_TYPES = [SettingType(1, "time_limit", "ms", None), SettingType(2, "max_errors", "errors", None)]
GAMES = [
    Game(1, 1, "memory", "Sequence Recall", "Repeat the sequence."),
    Game(2, 2, "attention", "Odd One Out", None),
]
LEVELS = [Level(1, 1, 1), Level(2, 1, 2), Level(3, 2, 1)]
LEVEL_SETTINGS = {
    1: [
        LevelSetting(1, "time_limit", Decimal("10000.00")),
        LevelSetting(1, "max_errors", Decimal("0.00")),
        LevelSetting(2, "time_limit", Decimal("8000.50")),
    ]
}


@pytest.fixture
def fake_repo():
    """Repository of fakes with the catalog above and one player (player_id 1)."""
    repo = Repository(
        player_store=FakePlayerStore(),
        session_store=FakeSessionStore(),
        check_in_store=FakeCheckInStore(),
        game_play_store=FakeGamePlayStore(),
        level_attempt_store=FakeLevelAttemptStore(),
        cognitive_domain_store=FakeCognitiveDomainStore(DOMAINS),
        game_store=FakeGameStore(GAMES),
        level_store=FakeLevelStore(LEVELS),
        level_setting_store=FakeLevelSettingStore(LEVEL_SETTINGS),
        setting_type_store=FakeSettingTypeStore(SETTING_TYPES),
        stats_store=FakeStatsStore(),
    )
    repo.player_store.create(CreatePlayerRequest("ada", date(1995, 12, 10)))
    return repo
