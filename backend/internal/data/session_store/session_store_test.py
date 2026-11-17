from internal.data.session_store import SessionStore


def test_create_get_list_end(db, make_player):
    player = make_player()
    store = SessionStore(db)
    first, second = store.create(player.player_id), store.create(player.player_id)
    assert first.ended_at is None and store.get_by_id(first.session_id) == first
    assert [s.session_id for s in store.list_by_player(player.player_id)] == [
        second.session_id,
        first.session_id,
    ]
    ended = store.end(first.session_id)
    assert ended.ended_at is not None
    assert store.end(first.session_id).ended_at == ended.ended_at  # second end is a no-op
    assert store.get_by_id(0) is None
