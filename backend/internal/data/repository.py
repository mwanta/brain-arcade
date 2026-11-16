"""Groups every table store into one object that handlers receive.

Add a field here for each new <table>_store. Tests can build one with fakes:
    Repository(user_store=FakeUserStore())
"""
from dataclasses import dataclass

from internal.data.user_store import UserStore


@dataclass(frozen=True)
class Repository:
    user_store: UserStore

    @classmethod
    def from_database(cls, database):
        """Builds every real store on one shared Database."""
        return cls(user_store=UserStore(database))
