SELECT level_id, game_id, level_number
FROM level
WHERE game_id = %(game_id)s
ORDER BY level_number
