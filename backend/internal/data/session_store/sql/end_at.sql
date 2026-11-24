-- Ends an open session at a given time (its last activity). No-op if it has already ended.
UPDATE session
SET ended_at = %(ended_at)s
WHERE session_id = %(session_id)s AND ended_at IS NULL
