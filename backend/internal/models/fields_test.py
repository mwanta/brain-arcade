from datetime import date, datetime
from decimal import Decimal

import pytest

from internal.errors import ValidationError
from internal.models.fields import (
    bool_field,
    date_field,
    datetime_field,
    int_field,
    iso,
    number,
    number_field,
    parse_fields,
)


def test_parse_fields_collects_all_errors_and_required():
    with pytest.raises(ValidationError) as exc:
        parse_fields({"a": "x", "b": None}, {"a": int_field(), "b": int_field()}, required=("b",))
    assert exc.value.details == {"a": "Must be a whole number", "b": "Required"}


def test_parse_fields_missing_optional_is_none():
    assert parse_fields({}, {"a": int_field()}) == {"a": None}


def test_parse_fields_rejects_non_object():
    with pytest.raises(ValidationError):
        parse_fields([1, 2], {"a": int_field()})


@pytest.mark.parametrize("raw", [True, 1.5, "abc", [1]])
def test_int_field_rejects(raw):
    with pytest.raises(ValueError):
        int_field()(raw)


def test_int_field_accepts_ints_and_digit_strings_and_checks_range():
    assert int_field()(3) == 3 and int_field()("42") == 42
    with pytest.raises(ValueError, match="at least 1"):
        int_field(min_value=1)(0)


def test_number_bool_date_fields():
    assert number_field(max_value=24)(7.5) == 7.5
    with pytest.raises(ValueError):
        number_field(max_value=24)(25)
    with pytest.raises(ValueError):
        bool_field()("true")
    assert date_field()("2026-11-01") == date(2026, 11, 1)


def test_datetime_field_converts_timezones_to_naive_utc():
    assert datetime_field()("2026-11-01T09:00:00-05:00") == datetime(2026, 11, 1, 14, 0)
    assert datetime_field()("2026-11-01T09:00:00") == datetime(2026, 11, 1, 9, 0)
    with pytest.raises(ValueError):
        datetime_field()("yesterday")


def test_output_formatting():
    assert iso(None) is None
    assert iso(datetime(2026, 1, 1, 9, 0)) == "2026-01-01T09:00:00.000"
    assert iso(date(2026, 1, 1)) == "2026-01-01"
    assert number(Decimal("3.00")) == 3 and number(Decimal("1.25")) == 1.25
    assert number(None) is None
