import pytest

from internal.errors import ValidationError
from internal.models.check_in import CheckIn, CreateCheckInRequest


def test_all_fields_optional():
    assert CreateCheckInRequest.from_json({}) == CreateCheckInRequest()


def test_valid_payload():
    req = CreateCheckInRequest.from_json(
        {"hours_slept": 7.5, "caffeine_drinks": 2, "stress_level": 3, "exercised_today": True}
    )
    assert req == CreateCheckInRequest(7.5, 2, 3, True)


def test_ranges_enforced():
    with pytest.raises(ValidationError) as exc:
        CreateCheckInRequest.from_json(
            {"hours_slept": 30, "caffeine_drinks": -1, "stress_level": 6, "exercised_today": "yes"}
        )
    assert set(exc.value.details) == {"hours_slept", "caffeine_drinks", "stress_level", "exercised_today"}


def test_to_json_converts_mysql_types():
    from decimal import Decimal

    out = CheckIn(1, 2, Decimal("7.5"), 1, 3, 1).to_json()
    assert out["hours_slept"] == 7.5 and out["exercised_today"] is True
