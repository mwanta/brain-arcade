"""Sessions and their check-ins.

Rules: a session belongs to an existing player; it can be ended once; it has at most
one check-in.
"""

from internal.data.database import DuplicateKeyError
from internal.errors import ConflictError, NotFoundError


class SessionHandler:
    def __init__(self, repo):
        self._players = repo.player_store
        self._sessions = repo.session_store
        self._check_ins = repo.check_in_store

    def start_session(self, req):
        if self._players.get_by_id(req.player_id) is None:
            raise NotFoundError(f"Player {req.player_id} not found")
        return self._sessions.create(req.player_id)

    def get_session(self, session_id):
        session = self._sessions.get_by_id(session_id)
        if session is None:
            raise NotFoundError(f"Session {session_id} not found")
        return session

    def list_player_sessions(self, player_id):
        if self._players.get_by_id(player_id) is None:
            raise NotFoundError(f"Player {player_id} not found")
        return self._sessions.list_by_player(player_id)

    def end_session(self, session_id):
        if self.get_session(session_id).ended_at is not None:
            raise ConflictError(f"Session {session_id} has already ended")
        return self._sessions.end(session_id)

    def create_check_in(self, session_id, req):
        self.get_session(session_id)
        if self._check_ins.get_by_session(session_id) is not None:
            raise _already_checked_in(session_id)
        try:
            return self._check_ins.create(session_id, req)
        except DuplicateKeyError:  # lost a race with a concurrent insert
            raise _already_checked_in(session_id)

    def get_check_in(self, session_id):
        self.get_session(session_id)
        check_in = self._check_ins.get_by_session(session_id)
        if check_in is None:
            raise NotFoundError(f"Session {session_id} has no check-in")
        return check_in


def _already_checked_in(session_id):
    return ConflictError(f"Session {session_id} already has a check-in")
