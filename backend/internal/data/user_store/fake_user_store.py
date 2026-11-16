"""In-memory UserStore with the same interface, used by handler and route tests."""
from dataclasses import replace
from datetime import datetime, timedelta

from internal.models.user import User

CREATED_AT = datetime(2026, 1, 1, 12, 0)


class FakeUserStore:
    def __init__(self):
        self._users, self._next_id = {}, 1

    def create(self, req):
        user = User(self._next_id, req.username, req.birthday, req.gender, CREATED_AT, CREATED_AT)
        self._users[user.user_id] = user
        self._next_id += 1
        return user

    def get_by_id(self, user_id):
        return self._users.get(user_id)

    def get_by_username(self, username):
        return next((u for u in self._users.values() if u.username == username), None)

    def list_all(self):
        return list(self._users.values())

    def update(self, user_id, req):
        user = self._users.get(user_id)
        if user is None:
            return None
        if req.changes():  # mirror MySQL's ON UPDATE NOW()
            user = replace(user, **req.changes(), updated_at=user.updated_at + timedelta(minutes=1))
            self._users[user_id] = user
        return user
