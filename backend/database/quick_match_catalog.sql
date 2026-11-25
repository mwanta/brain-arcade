-- Add Quick Match's levels to an existing, seeded database.
-- Run with the MySQL client against brain_arcade. Safe to run more than once.
-- Catalog data only. All IDs are resolved by name and level number.
-- Uses only existing tables: game, level, setting_type and level_setting.
USE brain_arcade;

START TRANSACTION;

INSERT INTO setting_type (name, unit, description)
VALUES ('trial_count', 'trials', 'Number of comparisons per Quick Match level.')
ON DUPLICATE KEY UPDATE name = VALUES(name);

UPDATE game
SET instructions = 'Remember the first symbol. For each new symbol, press right for Same or left for Different compared with the immediately previous symbol. Complete every comparison within the per-symbol time limit and stay within the error allowance to pass. Wrong answers and timeouts each count as one error.'
WHERE name = 'Quick Match';

INSERT INTO level (game_id, level_number)
SELECT g.game_id, c.level_number
FROM game g
CROSS JOIN (
    SELECT 1 AS level_number UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
    UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
) c
WHERE g.name = 'Quick Match'
ON DUPLICATE KEY UPDATE level_number = VALUES(level_number);

INSERT INTO level_setting (level_id, setting_type_id, setting_value)
SELECT l.level_id, st.setting_type_id,
       CASE st.name
           WHEN 'time_limit' THEN CASE l.level_number
               WHEN 1 THEN 2000
               WHEN 2 THEN 1200
               WHEN 3 THEN 1100
               WHEN 4 THEN 1000
               WHEN 5 THEN 900
               WHEN 6 THEN 800
               WHEN 7 THEN 700
               WHEN 8 THEN 600
               WHEN 9 THEN 500
               WHEN 10 THEN 400
           END
           WHEN 'max_errors' THEN CASE WHEN l.level_number = 1 THEN 2 ELSE 1 END
           WHEN 'trial_count' THEN 12
       END
FROM game g
JOIN level l ON l.game_id = g.game_id
CROSS JOIN setting_type st
WHERE g.name = 'Quick Match' AND l.level_number BETWEEN 1 AND 10
  AND st.name IN ('time_limit', 'max_errors', 'trial_count')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

COMMIT;
