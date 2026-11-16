from datetime import date

import pytest

from internal.data.repository import Repository
from internal.data.user_store.fake_user_store import FakeUserStore
from internal.errors import ConflictError, NotFoundError
from internal.handlers.user_handler import UserHandler
from internal.models.user import CreateUserRequest, UpdateUserRequest

BDAY = date(1995, 12, 10)


@pytest.fixture
def handler():
    return UserHandler(Repository(user_store=FakeUserStore()))


def test_create_then_get(handler):
    created = handler.create_user(CreateUserRequest("ada", BDAY, "female"))
    assert handler.get_user(created.user_id) == created
    assert handler.list_users() == [created]


def test_create_duplicate_username_conflicts(handler):
    handler.create_user(CreateUserRequest("ada", BDAY))
    with pytest.raises(ConflictError):
        handler.create_user(CreateUserRequest("ada", BDAY))


def test_update_applies_only_changed_fields(handler):
    user = handler.create_user(CreateUserRequest("ada", BDAY, "female"))
    updated = handler.update_user(user.user_id, UpdateUserRequest.from_json({"username": "ada2"}))
    assert (updated.username, updated.birthday, updated.gender) == ("ada2", BDAY, "female")
    assert updated.updated_at > user.updated_at
    assert updated.created_at == user.created_at


def test_update_to_own_username_is_allowed(handler):
    user = handler.create_user(CreateUserRequest("ada", BDAY))
    assert handler.update_user(user.user_id, UpdateUserRequest.from_json({"username": "ada"})).username == "ada"


def test_update_to_taken_username_conflicts(handler):
    handler.create_user(CreateUserRequest("ada", BDAY))
    alan = handler.create_user(CreateUserRequest("alan", BDAY))
    with pytest.raises(ConflictError):
        handler.update_user(alan.user_id, UpdateUserRequest.from_json({"username": "ada"}))


def test_missing_user_raises_not_found(handler):
    with pytest.raises(NotFoundError):
        handler.get_user(99)
    with pytest.raises(NotFoundError):
        handler.update_user(99, UpdateUserRequest.from_json({"gender": "male"}))
