"""In-memory PlayerStore with the same interface, used by handler and route tests."""

from dataclasses import replace
from datetime import datetime, timedelta

from internal.models.player import Player

CREATED_AT = datetime(2026, 1, 1, 12, 0)


class FakePlayerStore:
    def __init__(self):
        self._players, self._next_id = {}, 1

    def create(self, req):
        player = Player(
            self._next_id,
            req.username,
            req.birthday,
            req.gender,
            req.occupation,
            req.education_level,
            CREATED_AT,
            CREATED_AT,
        )
        self._players[player.player_id] = player
        self._next_id += 1
        return player

    def get_by_id(self, player_id):
        return self._players.get(player_id)

    def get_by_username(self, username):
        return next((u for u in self._players.values() if u.username == username), None)

    def list_all(self):
        return list(self._players.values())

    def update(self, player_id, req):
        player = self._players.get(player_id)
        if player is None:
            return None
        if req.changes():  # mirror MySQL's ON UPDATE NOW()
            player = replace(player, **req.changes(), updated_at=player.updated_at + timedelta(minutes=1))
            self._players[player_id] = player
        return player
