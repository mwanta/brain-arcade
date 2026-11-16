SELECT user_id, username, birthday, gender, created_at, updated_at
FROM users
WHERE username = %(username)s
