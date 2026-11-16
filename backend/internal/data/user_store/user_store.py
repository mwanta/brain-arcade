"""Data access for the `users` table. Queries live in ./sql/*.sql."""
from pathlib import Path

from internal.data.sql_loader import load_queries
from internal.models.user import UPDATABLE_FIELDS, User

_SQL = load_queries(Path(__file__).parent / "sql")


class UserStore:
    def __init__(self, database):
        self._db = database

    def create(self, req):
        """Inserts a CreateUserRequest and returns the new User."""
        with self._db.cursor() as cur:
            cur.execute(_SQL["create"], {
                "username": req.username, "birthday": req.birthday, "gender": req.gender,
            })
            new_id = cur.lastrowid
        return self.get_by_id(new_id)

    def get_by_id(self, user_id):
        with self._db.cursor() as cur:
            cur.execute(_SQL["get_by_id"], {"user_id": user_id})
            return _to_user(cur.fetchone())

    def get_by_username(self, username):
        with self._db.cursor() as cur:
            cur.execute(_SQL["get_by_username"], {"username": username})
            return _to_user(cur.fetchone())

    def list_all(self):
        with self._db.cursor() as cur:
            cur.execute(_SQL["list_all"])
            return [_to_user(row) for row in cur.fetchall()]

    def update(self, user_id, req):
        """Applies an UpdateUserRequest. Returns the updated User, or None if not found."""
        changes = req.changes()
        if changes:
            params = {"user_id": user_id}
            for name in UPDATABLE_FIELDS:
                params[f"set_{name}"] = name in changes
                params[name] = changes.get(name)
            with self._db.cursor() as cur:
                cur.execute(_SQL["update"], params)
        return self.get_by_id(user_id)


def _to_user(row):
    return User(**row) if row else None
