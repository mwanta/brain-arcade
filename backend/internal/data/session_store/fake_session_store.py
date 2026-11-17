from dataclasses import replace
from datetime import datetime, timedelta

from internal.models.session import Session

BASE_TIME = datetime(2026, 1, 1, 9, 0)


class FakeSessionStore:
    def __init__(self):
        self._sessions, self._next_id = {}, 1

    def create(self, player_id):
        session = Session(self._next_id, player_id, BASE_TIME + timedelta(hours=self._next_id), None)
        self._sessions[session.session_id] = session
        self._next_id += 1
        return session

    def get_by_id(self, session_id):
        return self._sessions.get(session_id)

    def list_by_player(self, player_id):
        return sorted(
            (s for s in self._sessions.values() if s.player_id == player_id),
            key=lambda s: (s.started_at, s.session_id),
            reverse=True,
        )

    def end(self, session_id):
        session = self._sessions.get(session_id)
        if session and session.ended_at is None:
            session = replace(session, ended_at=session.started_at + timedelta(minutes=20))
            self._sessions[session_id] = session
        return session
