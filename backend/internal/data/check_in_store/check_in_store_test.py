import pytest

from internal.data.check_in_store import CheckInStore
from internal.data.database import DuplicateKeyError
from internal.data.session_store import SessionStore
from internal.models.check_in import CreateCheckInRequest


def test_create_and_get_one_per_session(db, make_player):
    session = SessionStore(db).create(make_player().player_id)
    store = CheckInStore(db)
    assert store.get_by_session(session.session_id) is None
    created = store.create(session.session_id, CreateCheckInRequest(7.5, 2, 3, True))
    assert created.to_json()["hours_slept"] == 7.5 and created.to_json()["exercised_today"] is True
    assert store.get_by_session(session.session_id) == created
    with pytest.raises(DuplicateKeyError):
        store.create(session.session_id, CreateCheckInRequest())
