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

    def end_at(self, session_id, ended_at):
        session = self._sessions.get(session_id)
        if session and session.ended_at is None:
            session = replace(session, ended_at=ended_at)
            self._sessions[session_id] = session
        return session

    def delete_if_empty(self, session_id):
        """Deletes an open session. The fake cannot see plays or check-ins (other stores), so the
        caller is trusted to have checked that the session is empty; the real store checks too."""
        session = self._sessions.get(session_id)
        if session is None or session.ended_at is not None:
            return False
        del self._sessions[session_id]
        return True
