import pytest

from internal.errors import ValidationError
from internal.models.session import StartSessionRequest


def test_start_session_request():
    assert StartSessionRequest.from_json({"player_id": 3}) == StartSessionRequest(3)
    with pytest.raises(ValidationError):
        StartSessionRequest.from_json({})
