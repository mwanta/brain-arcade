SELECT session_id, player_id, started_at, ended_at
FROM session
WHERE player_id = %(player_id)s
ORDER BY started_at DESC, session_id DESC
