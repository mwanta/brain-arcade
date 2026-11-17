from internal.data.level_store import LevelStore


def test_list_by_game_in_level_order_and_get(db):
    store = LevelStore(db)
    levels = store.list_by_game(1)
    assert [lvl.level_number for lvl in levels] == sorted(lvl.level_number for lvl in levels)
    assert all(lvl.game_id == 1 for lvl in levels)
    assert store.get_by_id(levels[0].level_id) == levels[0]
    assert store.get_by_id(0) is None
