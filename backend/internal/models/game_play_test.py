import pytest

from internal.errors import ValidationError
from internal.models.game_play import StartGamePlayRequest


def test_start_game_play_request_requires_both_ids():
    assert StartGamePlayRequest.from_json({"session_id": 1, "game_id": 2}) == StartGamePlayRequest(1, 2)
    with pytest.raises(ValidationError) as exc:
        StartGamePlayRequest.from_json({"session_id": 1})
    assert exc.value.details == {"game_id": "Required"}
