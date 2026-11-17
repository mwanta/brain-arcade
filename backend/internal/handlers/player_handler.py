"""Business logic for players: existence and uniqueness rules.

Takes and returns models; knows nothing about HTTP or SQL.
"""

from internal.data.database import DuplicateKeyError
from internal.errors import ConflictError, NotFoundError


class PlayerHandler:
    def __init__(self, repo):
        self._store = repo.player_store

    def list_players(self):
        return self._store.list_all()

    def get_player(self, player_id):
        player = self._store.get_by_id(player_id)
        if player is None:
            raise NotFoundError(f"Player {player_id} not found")
        return player

    def create_player(self, req):
        if self._store.get_by_username(req.username):
            raise _username_taken(req.username)
        try:
            return self._store.create(req)
        except DuplicateKeyError:  # lost a race with a concurrent insert
            raise _username_taken(req.username)

    def update_player(self, player_id, req):
        self.get_player(player_id)
        if "username" in req.fields_set:
            existing = self._store.get_by_username(req.username)
            if existing and existing.player_id != player_id:
                raise _username_taken(req.username)
        try:
            return self._store.update(player_id, req)
        except DuplicateKeyError:
            raise _username_taken(req.username)


def _username_taken(username):
    return ConflictError("Username already taken", {"username": f"'{username}' is already taken"})
