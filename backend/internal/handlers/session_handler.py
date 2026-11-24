"""Sessions and their check-ins.

Rules: a session belongs to an existing player; it can be ended once; it has at most
one check-in. Starting a session first tidies the player's other open sessions that have
gone quiet (see STALE_AFTER).
"""

import logging
from datetime import timedelta

from internal.data.database import DuplicateKeyError
from internal.errors import ConflictError, NotFoundError

log = logging.getLogger(__name__)

# An open session with no activity (it starting, or a play starting or finishing) for this long
# is left over from a player who closed the page, and is cleaned up when they next start one.
STALE_AFTER = timedelta(hours=2)


def last_activity(session, plays):
    """The latest time anything happened in the session."""
    times = [session.started_at]
    for play in plays:
        times.append(play.started_at)
        if play.finished_at is not None:
            times.append(play.finished_at)
    return max(times)


class SessionHandler:
    def __init__(self, repo):
        self._players = repo.player_store
        self._sessions = repo.session_store
        self._check_ins = repo.check_in_store
        self._plays = repo.game_play_store

    def start_session(self, req):
        if self._players.get_by_id(req.player_id) is None:
            raise NotFoundError(f"Player {req.player_id} not found")
        session = self._sessions.create(req.player_id)
        try:
            self._close_stale_sessions(session)
        except Exception:  # tidying must never stop a player starting a game
            log.exception("Could not clean up old sessions of player %s", req.player_id)
        return session

    def _close_stale_sessions(self, new_session):
        """Tidies the player's other open sessions that have been quiet for STALE_AFTER.

        "Now" is the new session's start time, so the database clock decides what is stale. A
        stale session that has a check-in or a finished play is ended at its last activity; one
        with neither is deleted, since it holds nothing for the stats.
        """
        for session in self._sessions.list_by_player(new_session.player_id):
            if session.session_id == new_session.session_id or session.ended_at is not None:
                continue
            plays = self._plays.list_by_session(session.session_id)
            last = last_activity(session, plays)
            if new_session.started_at - last < STALE_AFTER:
                continue
            has_finished_play = any(p.finished_at is not None for p in plays)
            has_check_in = self._check_ins.get_by_session(session.session_id) is not None
            if has_finished_play or has_check_in:
                self._sessions.end_at(session.session_id, last)
            else:
                self._sessions.delete_if_empty(session.session_id)

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
