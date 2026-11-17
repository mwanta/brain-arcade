from datetime import datetime

import pytest

from internal.errors import ValidationError
from internal.models.level_attempt import CreateLevelAttemptRequest, LevelAttempt


def test_minimal_and_full_payloads():
    assert CreateLevelAttemptRequest.from_json({"level_id": 1, "passed": False}) == CreateLevelAttemptRequest(
        1, False
    )
    req = CreateLevelAttemptRequest.from_json(
        {
            "level_id": 1,
            "passed": True,
            "duration_ms": 900,
            "error_count": 0,
            "started_at": "2026-11-01T09:00:00.250Z",
        }
    )
    assert req.started_at == datetime(2026, 11, 1, 9, 0, 0, 250000) and req.error_count == 0


def test_invalid_payload():
    with pytest.raises(ValidationError) as exc:
        CreateLevelAttemptRequest.from_json({"passed": 1, "duration_ms": -5})
    assert set(exc.value.details) == {"level_id", "passed", "duration_ms"}


def test_to_json_passed_is_bool():
    attempt = LevelAttempt(1, 2, 3, datetime(2026, 1, 1, 9, 0, 0, 500000), 1, 100, 0)
    assert attempt.to_json()["passed"] is True
    assert attempt.to_json()["started_at"] == "2026-01-01T09:00:00.500"
