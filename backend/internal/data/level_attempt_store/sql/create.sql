INSERT INTO level_attempt (play_id, level_id, started_at, passed, duration_ms, error_count)
VALUES (%(play_id)s, %(level_id)s, COALESCE(%(started_at)s, NOW(3)),
        %(passed)s, %(duration_ms)s, %(error_count)s)
