from internal.config import Config
from internal.data.database import Database
from internal.data.repository import Repository
from internal.data.user_store import UserStore


def test_from_database_builds_every_store_on_shared_database():
    db = Database(Config())  # no connection is opened until a query runs
    repo = Repository.from_database(db)
    assert isinstance(repo.user_store, UserStore)
    assert repo.user_store._db is db
