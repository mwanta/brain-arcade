SELECT user_id, username, birthday, gender, created_at, updated_at
FROM users
WHERE user_id = %(user_id)s
