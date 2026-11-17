-- Partial update in one statement: each set_<field> flag says whether the
-- client provided that field. Unprovided fields keep their current value.
-- updated_at is bumped automatically by ON UPDATE NOW() in the schema.
UPDATE player
SET username = IF(%(set_username)s, %(username)s, username),
    birthday = IF(%(set_birthday)s, %(birthday)s, birthday),
    gender   = IF(%(set_gender)s,   %(gender)s,   gender)
WHERE player_id = %(player_id)s
