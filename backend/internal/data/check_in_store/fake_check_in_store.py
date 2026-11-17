from internal.data.database import DuplicateKeyError
from internal.models.check_in import CheckIn


class FakeCheckInStore:
    def __init__(self):
        self._by_session, self._next_id = {}, 1

    def create(self, session_id, req):
        if session_id in self._by_session:
            raise DuplicateKeyError("check_in.session_id")
        check_in = CheckIn(
            self._next_id,
            session_id,
            req.hours_slept,
            req.caffeine_drinks,
            req.stress_level,
            req.exercised_today,
        )
        self._by_session[session_id] = check_in
        self._next_id += 1
        return check_in

    def get_by_session(self, session_id):
        return self._by_session.get(session_id)
