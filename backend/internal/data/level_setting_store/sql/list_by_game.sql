-- Every setting for every level of one game, with the setting's name.
SELECT ls.level_id, st.name, ls.setting_value AS value
FROM level_setting ls
JOIN setting_type st ON st.setting_type_id = ls.setting_type_id
JOIN level l         ON l.level_id = ls.level_id
WHERE l.game_id = %(game_id)s
ORDER BY ls.level_id, st.name
