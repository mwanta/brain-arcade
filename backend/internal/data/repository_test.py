from dataclasses import fields

from internal.config import Config
from internal.data.database import Database
from internal.data.repository import Repository


def test_from_database_builds_every_store_on_shared_database():
    db = Database(Config())  # no connection is opened until a query runs
    repo = Repository.from_database(db)
    for f in fields(Repository):
        store = getattr(repo, f.name)
        assert store is not None, f"{f.name} not built in from_database"
        assert store._db is db
