SELECT session_id, player_id, started_at, ended_at
FROM session
WHERE session_id = %(session_id)s
