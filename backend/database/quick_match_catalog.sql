-- Add Quick Match's levels to an existing, seeded database.
-- Run with the MySQL client against brain_arcade. Safe to run more than once.
-- Catalog data only. All IDs are resolved by name and level number.
USE brain_arcade;

CREATE TEMPORARY TABLE quick_match_config (
    level_number INT PRIMARY KEY,
    time_limit INT NOT NULL,
    max_errors INT NOT NULL,
    trial_count INT NOT NULL
);
INSERT INTO quick_match_config VALUES
    (1, 2000, 2, 12), (2, 1200, 1, 12), (3, 1100, 1, 12),
    (4, 1000, 1, 12), (5, 900, 1, 12), (6, 800, 1, 12),
    (7, 700, 1, 12), (8, 600, 1, 12), (9, 500, 1, 12), (10, 400, 1, 12);

START TRANSACTION;

INSERT INTO setting_type (name, unit, description)
VALUES ('trial_count', 'trials', 'Number of comparisons per Quick Match level.')
ON DUPLICATE KEY UPDATE name = VALUES(name);

UPDATE game
SET instructions = 'Remember the first symbol. For each new symbol, press right for Same or left for Different compared with the immediately previous symbol. Complete every comparison within the per-symbol time limit and stay within the error allowance to pass. Wrong answers and timeouts each count as one error.'
WHERE name = 'Quick Match';

INSERT INTO level (game_id, level_number)
SELECT g.game_id, c.level_number
FROM game g CROSS JOIN quick_match_config c
WHERE g.name = 'Quick Match'
ON DUPLICATE KEY UPDATE level_number = VALUES(level_number);

INSERT INTO level_setting (level_id, setting_type_id, setting_value)
SELECT l.level_id, st.setting_type_id,
       CASE st.name
           WHEN 'time_limit' THEN c.time_limit
           WHEN 'max_errors' THEN c.max_errors
           WHEN 'trial_count' THEN c.trial_count
       END
FROM game g
JOIN level l ON l.game_id = g.game_id
JOIN quick_match_config c ON c.level_number = l.level_number
CROSS JOIN setting_type st
WHERE g.name = 'Quick Match' AND st.name IN ('time_limit', 'max_errors', 'trial_count')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

COMMIT;
DROP TEMPORARY TABLE quick_match_config;
