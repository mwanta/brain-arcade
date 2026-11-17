"""Data access for the `setting_type` table (read-only catalog)."""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.setting_type import SettingType

_SQL = load_queries(Path(__file__).parent / "sql")


class SettingTypeStore:
    def __init__(self, database):
        self._db = database

    def list_all(self):
        with self._db.cursor() as cur:
            cur.execute(_SQL["list_all"])
            return [SettingType(**row) for row in cur.fetchall()]
