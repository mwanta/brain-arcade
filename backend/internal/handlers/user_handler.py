"""Business logic for users: existence and uniqueness rules.

Takes and returns models; knows nothing about HTTP or SQL.
"""
from internal.data.database import DuplicateKeyError
from internal.errors import ConflictError, NotFoundError


class UserHandler:
    def __init__(self, repo):
        self._store = repo.user_store

    def list_users(self):
        return self._store.list_all()

    def get_user(self, user_id):
        user = self._store.get_by_id(user_id)
        if user is None:
            raise NotFoundError(f"User {user_id} not found")
        return user

    def create_user(self, req):
        if self._store.get_by_username(req.username):
            raise _username_taken(req.username)
        try:
            return self._store.create(req)
        except DuplicateKeyError:  # lost a race with a concurrent insert
            raise _username_taken(req.username)

    def update_user(self, user_id, req):
        self.get_user(user_id)
        if "username" in req.fields_set:
            existing = self._store.get_by_username(req.username)
            if existing and existing.user_id != user_id:
                raise _username_taken(req.username)
        try:
            return self._store.update(user_id, req)
        except DuplicateKeyError:
            raise _username_taken(req.username)


def _username_taken(username):
    return ConflictError("Username already taken", {"username": f"'{username}' is already taken"})
