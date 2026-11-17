"""Game plays and their level attempts.

Rules: a play starts in an open (not ended) session for an existing game; it can be
finished once; attempts can only be added to an unfinished play, for a level of that
play's game.
"""

from internal.errors import ConflictError, NotFoundError, ValidationError


class GamePlayHandler:
    def __init__(self, repo):
        self._sessions = repo.session_store
        self._games = repo.game_store
        self._levels = repo.level_store
        self._plays = repo.game_play_store
        self._attempts = repo.level_attempt_store

    def start_play(self, req):
        session = self._sessions.get_by_id(req.session_id)
        if session is None:
            raise NotFoundError(f"Session {req.session_id} not found")
        if session.ended_at is not None:
            raise ConflictError(f"Session {req.session_id} has already ended")
        if self._games.get_by_id(req.game_id) is None:
            raise NotFoundError(f"Game {req.game_id} not found")
        return self._plays.create(req.session_id, req.game_id)

    def get_play(self, play_id):
        play = self._plays.get_by_id(play_id)
        if play is None:
            raise NotFoundError(f"Game play {play_id} not found")
        return play

    def list_session_plays(self, session_id):
        if self._sessions.get_by_id(session_id) is None:
            raise NotFoundError(f"Session {session_id} not found")
        return self._plays.list_by_session(session_id)

    def finish_play(self, play_id):
        if self.get_play(play_id).finished_at is not None:
            raise ConflictError(f"Game play {play_id} has already finished")
        return self._plays.finish(play_id)

    def record_attempt(self, play_id, req):
        play = self.get_play(play_id)
        if play.finished_at is not None:
            raise ConflictError(f"Game play {play_id} has already finished")
        level = self._levels.get_by_id(req.level_id)
        if level is None or level.game_id != play.game_id:
            raise ValidationError(
                "Invalid data", {"level_id": f"Level {req.level_id} is not a level of game {play.game_id}"}
            )
        return self._attempts.create(play_id, req)

    def list_attempts(self, play_id):
        self.get_play(play_id)
        return self._attempts.list_by_play(play_id)
