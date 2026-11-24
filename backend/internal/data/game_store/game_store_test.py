from internal.data.game_store import GameStore
from internal.data.repository import Repository
from internal.handlers.catalog_handler import CatalogHandler


def test_list_and_get_include_domain_name(db):
    store = GameStore(db)
    games = store.list_all()
    assert games and [g.name for g in games] == sorted(g.name for g in games)
    game = store.get_by_id(games[0].game_id)
    assert game == games[0] and game.domain_name
    assert store.get_by_id(0) is None


def test_quick_match_catalog_has_ten_progressively_faster_levels(db):
    game = next(game for game in GameStore(db).list_all() if game.name == "Quick Match")
    detail = CatalogHandler(Repository.from_database(db)).get_game(game.game_id)
    assert game.domain_name == "processing_speed"
    assert [level.level_number for level in detail.levels] == list(range(1, 11))
    assert [int(level.settings["time_limit"]) for level in detail.levels] == [
        2000,
        1200,
        1100,
        1000,
        900,
        800,
        700,
        600,
        500,
        400,
    ]
    assert [int(level.settings["max_errors"]) for level in detail.levels] == [2] + [1] * 9
    assert all(level.settings["trial_count"] == 12 for level in detail.levels)
