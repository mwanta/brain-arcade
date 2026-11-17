from internal.data.game_store import GameStore


def test_list_and_get_include_domain_name(db):
    store = GameStore(db)
    games = store.list_all()
    assert games and [g.name for g in games] == sorted(g.name for g in games)
    game = store.get_by_id(games[0].game_id)
    assert game == games[0] and game.domain_name
    assert store.get_by_id(0) is None
