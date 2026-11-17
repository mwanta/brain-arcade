"""Data access for the `player` table. Queries live in ./sql/*.sql."""

from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.player import UPDATABLE_FIELDS, Player

_SQL = load_queries(Path(__file__).parent / "sql")


class PlayerStore:
    def __init__(self, database):
        self._db = database

    def create(self, req):
        """Inserts a CreatePlayerRequest and returns the new Player."""
        with self._db.cursor() as cur:
            cur.execute(
                _SQL["create"],
                {
                    "username": req.username,
                    "birthday": req.birthday,
                    "gender": req.gender,
                },
            )
            new_id = cur.lastrowid
        return self.get_by_id(new_id)

    def get_by_id(self, player_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["get_by_id"], {"player_id": player_id})
            return _to_player(cur.fetchone())

    def get_by_username(self, username):
        with self._db.cursor() as cur:
            cur.execute(_SQL["get_by_username"], {"username": username})
            return _to_player(cur.fetchone())

    def list_all(self):
        with self._db.cursor() as cur:
            cur.execute(_SQL["list_all"])
            return [_to_player(row) for row in cur.fetchall()]

    def update(self, player_id, req):
        """Applies an UpdatePlayerRequest. Returns the updated Player, or None if not found."""
        changes = req.changes()
        if changes:
            params = {"player_id": player_id}
            for name in UPDATABLE_FIELDS:
                params[f"set_{name}"] = name in changes
                params[name] = changes.get(name)
            with self._db.cursor() as cur:
                cur.execute(_SQL["update"], params)
        return self.get_by_id(player_id)


def _to_player(row):
    return Player(**row) if row else None
