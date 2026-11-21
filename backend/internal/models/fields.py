"""Shared helpers for models: parsing request input and formatting output.

Parsers raise ValueError with a user-facing message; `parse_fields` collects
those into a single ValidationError with per-field details.
"""

from datetime import date, datetime, timezone
from decimal import Decimal

from internal.errors import ValidationError


def parse_fields(payload, spec, required=()):
    """Parses `payload` (a dict) with `spec` ({name: parser}).

    Missing or empty values become None, or a "Required" error for names in `required`.
    """
    if not isinstance(payload, dict):
        raise ValidationError("Request body must be a JSON object")
    errors, values = {}, {}
    for name, parser in spec.items():
        raw = payload.get(name)
        if raw is None or raw == "":
            if name in required:
                errors[name] = "Required"
            values[name] = None
            continue
        try:
            values[name] = parser(raw)
        except ValueError as exc:
            errors[name] = str(exc)
    if errors:
        raise ValidationError("Invalid data", errors)
    return values


# ---- parsers (each returns a function raw -> value) -------------------------


def int_field(min_value=None, max_value=None):
    def parse(raw):
        if isinstance(raw, bool) or not isinstance(raw, (int, str)):
            raise ValueError("Must be a whole number")
        try:
            value = int(raw)
        except ValueError:
            raise ValueError("Must be a whole number")
        _check_range(value, min_value, max_value)
        return value

    return parse


def number_field(min_value=None, max_value=None):
    def parse(raw):
        if isinstance(raw, bool) or not isinstance(raw, (int, float, str)):
            raise ValueError("Must be a number")
        try:
            value = float(raw)
        except ValueError:
            raise ValueError("Must be a number")
        _check_range(value, min_value, max_value)
        return value

    return parse


def bool_field():
    def parse(raw):
        if not isinstance(raw, bool):
            raise ValueError("Must be true or false")
        return raw

    return parse


def date_field():
    def parse(raw):
        try:
            return date.fromisoformat(raw)
        except (TypeError, ValueError):
            raise ValueError("Must be a date in YYYY-MM-DD format")

    return parse


def datetime_field():
    """ISO 8601 datetime. Values with a timezone are converted to naive UTC."""

    def parse(raw):
        try:
            value = datetime.fromisoformat(raw)
        except (TypeError, ValueError):
            raise ValueError("Must be an ISO 8601 datetime, e.g. 2026-11-01T09:00:00")
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    return parse


def choice_field(choices):
    """One value from a fixed list."""

    def parse(raw):
        if raw not in choices:
            raise ValueError(f"Must be one of: {', '.join(choices)}")
        return raw

    return parse


def choice_list_field(choices):
    """Comma-separated values from a fixed list, e.g. "student,retired" -> ("student", "retired")."""

    def parse(raw):
        if not isinstance(raw, str):
            raise ValueError("Must be a comma-separated list")
        values = tuple(dict.fromkeys(v.strip() for v in raw.split(",") if v.strip()))
        bad = [v for v in values if v not in choices]
        if bad or not values:
            raise ValueError(f"Each value must be one of: {', '.join(choices)}")
        return values

    return parse


def _check_range(value, min_value, max_value):
    if min_value is not None and value < min_value:
        raise ValueError(f"Must be at least {min_value}")
    if max_value is not None and value > max_value:
        raise ValueError(f"Must be at most {max_value}")


# ---- output formatting -------------------------------------------------------


def iso(value):
    """date/datetime -> ISO string (milliseconds for datetimes); None stays None."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat(timespec="milliseconds")
    return value.isoformat()


def number(value, places=2):
    """Decimal/float from MySQL -> int if whole, else a rounded float; None stays None."""
    if value is None:
        return None
    value = float(value) if isinstance(value, Decimal) else value
    return int(value) if float(value).is_integer() else round(value, places)
