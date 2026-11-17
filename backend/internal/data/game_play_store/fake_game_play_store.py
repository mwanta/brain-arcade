from dataclasses import replace
from datetime import datetime, timedelta

from internal.models.game_play import GamePlay

BASE_TIME = datetime(2026, 1, 1, 9, 0)


class FakeGamePlayStore:
    """Scores are always 0 here; the real score comes from a MySQL view."""

    def __init__(self):
        self._plays, self._next_id = {}, 1

    def create(self, session_id, game_id):
        play = GamePlay(
            self._next_id, session_id, game_id, BASE_TIME + timedelta(minutes=self._next_id), None, 0
        )
        self._plays[play.play_id] = play
        self._next_id += 1
        return play

    def get_by_id(self, play_id):
        return self._plays.get(play_id)

    def list_by_session(self, session_id):
        return sorted(
            (p for p in self._plays.values() if p.session_id == session_id),
            key=lambda p: (p.started_at, p.play_id),
        )

    def finish(self, play_id):
        play = self._plays.get(play_id)
        if play and play.finished_at is None:
            play = replace(play, finished_at=play.started_at + timedelta(minutes=5))
            self._plays[play_id] = play
        return play
