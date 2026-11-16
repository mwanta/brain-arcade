from datetime import date, datetime

import pytest

from internal.errors import ValidationError
from internal.models.user import CreateUserRequest, UpdateUserRequest, User


def test_create_request_parses_valid_payload():
    req = CreateUserRequest.from_json({"username": " ada ", "birthday": "1995-12-10", "gender": "female"})
    assert req == CreateUserRequest("ada", date(1995, 12, 10), "female")


def test_create_request_gender_is_optional():
    req = CreateUserRequest.from_json({"username": "ada", "birthday": "1995-12-10", "gender": ""})
    assert req.gender is None


@pytest.mark.parametrize("birthday", [None, ""])
def test_create_request_requires_birthday(birthday):
    with pytest.raises(ValidationError) as exc:
        CreateUserRequest.from_json({"username": "ada", "birthday": birthday})
    assert exc.value.details == {"birthday": "Required"}


def test_create_request_reports_every_invalid_field():
    with pytest.raises(ValidationError) as exc:
        CreateUserRequest.from_json({"username": "x", "birthday": "nope", "gender": "robot", "user_id": 5})
    assert set(exc.value.details) == {"username", "birthday", "gender", "user_id"}


def test_future_birthday_rejected():
    with pytest.raises(ValidationError):
        CreateUserRequest.from_json({"username": "ada", "birthday": "2999-01-01"})


def test_non_object_body_rejected():
    with pytest.raises(ValidationError):
        CreateUserRequest.from_json(None)


def test_update_request_tracks_only_provided_fields():
    assert UpdateUserRequest.from_json({"gender": None}).changes() == {"gender": None}
    assert UpdateUserRequest.from_json({}).changes() == {}


def test_update_request_cannot_clear_birthday():
    with pytest.raises(ValidationError):
        UpdateUserRequest.from_json({"birthday": None})


@pytest.mark.parametrize("field", ["user_id", "created_at", "updated_at"])
def test_update_request_rejects_server_assigned_fields(field):
    with pytest.raises(ValidationError):
        UpdateUserRequest.from_json({field: "2020-01-01"})


def test_user_to_json():
    user = User(1, "ada", date(1995, 12, 10), None, datetime(2026, 1, 1, 12, 0), datetime(2026, 1, 2, 9, 30))
    assert user.to_json() == {"user_id": 1, "username": "ada", "birthday": "1995-12-10", "gender": None,
                              "created_at": "2026-01-01T12:00:00", "updated_at": "2026-01-02T09:30:00"}
