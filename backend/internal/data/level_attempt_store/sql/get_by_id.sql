SELECT attempt_id, play_id, level_id, started_at, passed, duration_ms, error_count
FROM level_attempt
WHERE attempt_id = %(attempt_id)s
