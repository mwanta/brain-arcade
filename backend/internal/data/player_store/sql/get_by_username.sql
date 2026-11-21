SELECT player_id, username, birthday, gender, occupation, education_level, created_at, updated_at
FROM player
WHERE username = %(username)s
