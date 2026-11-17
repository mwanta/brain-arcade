SELECT player_id, username, birthday, gender, created_at, updated_at
FROM player
WHERE player_id = %(player_id)s
