from internal.data.level_setting_store import LevelSettingStore
from internal.data.level_store import LevelStore


def test_list_by_game_only_returns_that_games_levels(db):
    level_ids = {lvl.level_id for lvl in LevelStore(db).list_by_game(1)}
    settings = LevelSettingStore(db).list_by_game(1)
    assert settings and {s.level_id for s in settings} <= level_ids
    assert {"max_errors", "time_limit"} <= {s.name for s in settings}
