"""Connection management for MySQL. Shared by all stores."""
from contextlib import contextmanager

import pymysql
from pymysql.cursors import DictCursor


class DuplicateKeyError(Exception):
    """Raised when an INSERT/UPDATE violates a UNIQUE constraint."""


class Database:
    def __init__(self, config):
        self._config = config

    @contextmanager
    def cursor(self):
        """Yields a dict cursor inside a transaction; commits on success, rolls back on error."""
        conn = pymysql.connect(
            host=self._config.db_host,
            port=self._config.db_port,
            user=self._config.db_user,
            password=self._config.db_password,
            database=self._config.db_name,
            cursorclass=DictCursor,
            autocommit=False,
        )
        try:
            with conn.cursor() as cur:
                yield cur
            conn.commit()
        except pymysql.err.IntegrityError as exc:
            conn.rollback()
            if exc.args and exc.args[0] == 1062:  # ER_DUP_ENTRY
                raise DuplicateKeyError(str(exc)) from exc
            raise
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
