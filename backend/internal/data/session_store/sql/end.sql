-- No-op if the session has already ended.
UPDATE session
SET ended_at = NOW()
WHERE session_id = %(session_id)s AND ended_at IS NULL
