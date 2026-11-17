SELECT attempt_id, play_id, level_id, started_at, passed, duration_ms, error_count
FROM level_attempt
WHERE play_id = %(play_id)s
ORDER BY started_at, attempt_id
