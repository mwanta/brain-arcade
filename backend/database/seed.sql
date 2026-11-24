USE brain_arcade;

-- ---- players ----------------------------------------------------------------
INSERT INTO player (username, birthday, gender, occupation, education_level) VALUES
    ('ada_lovelace',  '1995-12-10', 'female',            'technology', 'master'),
    ('alan_turing',   '1992-06-23', 'male',              'education',  'doctorate'),
    ('grace_hopper',  '1990-12-09', 'female',            'technology', 'doctorate'),
    ('sam_rivera',    '2001-03-15', 'non_binary',        'student',    'some_college'),
    ('casual_player', '2006-05-10', 'prefer_not_to_say', NULL,         NULL);

-- ---- game catalog -----------------------------------------------------------
INSERT INTO cognitive_domain (domain_id, name, description) VALUES
    (1, 'memory',                'Holding and recalling information over short periods.'),
    (2, 'attention',             'Staying focused on relevant items while ignoring distractions.'),
    (3, 'processing_speed',      'How quickly simple tasks are completed accurately.'),
    (4, 'cognitive_flexibility', 'Switching between rules or tasks quickly and accurately.');

INSERT INTO game (game_id, domain_id, name, instructions) VALUES
    (1, 1, 'Sequence Recall', 'Watch the tiles light up, then tap them back in the same order.'),
    (2, 2, 'Odd One Out',     'Tap the single shape that differs from the rest before time runs out.'),
    (3, 3, 'Quick Match',     'Remember the first symbol. For each new symbol, press right for Same or left for Different compared with the immediately previous symbol. Complete every comparison within the per-symbol time limit and stay within the error allowance to pass. Wrong answers and timeouts each count as one error.'),
    (4, 4, 'Drift',           'Follow the cars. If a red car is driving, tap the arrow for the way it is moving. If a blue car is drifting, with tire smoke and skid marks, tap the arrow for the way it is facing. Ignore the grey cars, they are only there to distract you.');

INSERT INTO setting_type (setting_type_id, name, unit, description) VALUES
    (1,  'sequence_length',     'items',  'Number of items the player must remember.'),
    (2,  'time_limit',          'ms',     'Time allowed to answer (per round in Drift); slower counts as a fail.'),
    (3,  'grid_size',           'cells',  'Number of cells on the board.'),
    (4,  'max_errors',          'errors', 'Most errors allowed while still passing the level (not used by Drift, which gives lives instead).'),
    (5,  'trial_count',         'trials', 'Number of comparisons per Quick Match level.'),
    (6,  'switch_probability',  'ratio',  'Chance the cars switch between driving and drifting from one round to the next.'),
    (7,  'car_count',           'cars',   'Cars to follow on the road at once.'),
    (8,  'move_speed',          'px/s',   'How fast the cars move across the screen.'),
    (9,  'conflict_ratio',      'ratio',  'Share of rounds where the cars'' facing and movement directions differ.'),
    (10, 'distractor_count',    'cars',   'Grey cars that drive straight the opposite way to the cars to follow, as distractions; 0 for none.');

INSERT INTO level (level_id, game_id, level_number) VALUES
    (1, 1, 1), (2, 1, 2), (3, 1, 3),
    (4, 2, 1), (5, 2, 2), (6, 2, 3),
    (7, 3, 1), (8, 3, 2),
    (9, 4, 1),  (10, 4, 2), (11, 4, 3), (12, 4, 4), (13, 4, 5),
    (14, 4, 6), (15, 4, 7), (16, 4, 8), (17, 4, 9), (18, 4, 10),
    (19, 3, 3), (20, 3, 4), (21, 3, 5), (22, 3, 6),
    (23, 3, 7), (24, 3, 8), (25, 3, 9), (26, 3, 10);

INSERT INTO level_setting (level_id, setting_type_id, setting_value) VALUES
    -- Sequence Recall: longer sequences, no errors allowed
    (1, 1, 3),  (1, 2, 10000), (1, 4, 0),
    (2, 1, 5),  (2, 2, 10000), (2, 4, 0),
    (3, 1, 7),  (3, 2,  8000), (3, 4, 0),
    -- Odd One Out: bigger grids, less time, no errors allowed
    (4, 3, 9),  (4, 2, 5000),  (4, 4, 0),
    (5, 3, 16), (5, 2, 4000),  (5, 4, 0),
    (6, 3, 25), (6, 2, 3000),  (6, 4, 0),
    -- Quick Match: 12 comparisons per level; time_limit is per comparison (ms).
    -- Keep the original two levels' time and error settings.
    (7, 2, 2000), (7, 4, 2), (7, 5, 12),
    (8, 2, 1200), (8, 4, 1), (8, 5, 12),
    (19, 2, 1100), (19, 4, 1), (19, 5, 12),
    (20, 2, 1000), (20, 4, 1), (20, 5, 12),
    (21, 2,  900), (21, 4, 1), (21, 5, 12),
    (22, 2,  800), (22, 4, 1), (22, 5, 12),
    (23, 2,  700), (23, 4, 1), (23, 5, 12),
    (24, 2,  600), (24, 4, 1), (24, 5, 12),
    (25, 2,  500), (25, 4, 1), (25, 5, 12),
    (26, 2,  400), (26, 4, 1), (26, 5, 12),
    -- Drift, levels 1-5 (no distractors): more cars, faster, more switching and conflict, less time
    -- columns: time_limit (per round), switch_probability, car_count, move_speed, conflict_ratio, distractor_count
    -- Round count and mistakes come from the game, not the database: 5 rounds per level, 5 lives per game.
    (9,  2, 3000), (9,  6, 0.20), (9,  7, 3), (9,  8,  60), (9,  9, 0.30), (9, 10, 0),
    (10, 2, 2800), (10, 6, 0.25), (10, 7, 4), (10, 8,  70), (10, 9, 0.35), (10, 10, 0),
    (11, 2, 2600), (11, 6, 0.30), (11, 7, 6), (11, 8,  80), (11, 9, 0.40), (11, 10, 0),
    (12, 2, 2400), (12, 6, 0.35), (12, 7, 8), (12, 8,  90), (12, 9, 0.45), (12, 10, 0),
    (13, 2, 2200), (13, 6, 0.40), (13, 7, 10), (13, 8, 100), (13, 9, 0.50), (13, 10, 0),
    -- Drift, levels 6-10 (grey distractor cars driving the other way): level 6 starts slow and sparse,
    -- then each level adds speed, cars and distractors
    (14, 2, 2600), (14, 6, 0.40), (14, 7, 3), (14, 8,  50), (14, 9, 0.50), (14, 10, 2),
    (15, 2, 2400), (15, 6, 0.45), (15, 7, 4), (15, 8,  70), (15, 9, 0.55), (15, 10, 3),
    (16, 2, 2200), (16, 6, 0.50), (16, 7, 5), (16, 8,  90), (16, 9, 0.60), (16, 10, 4),
    (17, 2, 2000), (17, 6, 0.55), (17, 7, 6), (17, 8, 110), (17, 9, 0.65), (17, 10, 5),
    (18, 2, 1800), (18, 6, 0.60), (18, 7, 8), (18, 8, 130), (18, 9, 0.70), (18, 10, 6);

-- ---- sessions and gameplay --------------------------------------------------
INSERT INTO session (session_id, player_id, started_at, ended_at) VALUES
    (1, 1, '2026-11-01 09:00:00', '2026-11-01 09:20:00'),
    (2, 1, '2026-11-02 21:30:00', '2026-11-02 21:45:00'),
    (3, 2, '2026-11-01 12:10:00', '2026-11-01 12:30:00'),
    (4, 4, '2026-11-03 08:00:00', NULL);  -- still in progress

INSERT INTO check_in (session_id, hours_slept, caffeine_drinks, stress_level, exercised_today) VALUES
    (1, 8.0, 1, 2, TRUE),
    (2, 5.5, 3, 4, FALSE),
    (3, 7.0, 0, 1, TRUE);

INSERT INTO game_play (play_id, session_id, game_id, started_at, finished_at) VALUES
    (1, 1, 1, '2026-11-01 09:01:00', '2026-11-01 09:06:00'),
    (2, 1, 2, '2026-11-01 09:07:00', '2026-11-01 09:12:00'),
    (3, 2, 1, '2026-11-02 21:31:00', '2026-11-02 21:35:00'),
    (4, 3, 3, '2026-11-01 12:11:00', '2026-11-01 12:15:00'),
    (5, 4, 2, '2026-11-03 08:01:00', NULL);

INSERT INTO level_attempt (play_id, level_id, started_at, passed, duration_ms, error_count) VALUES
    -- play 1: Sequence Recall, passes levels 1-2, fails 3 -> score 2
    (1, 1, '2026-11-01 09:01:05.000', TRUE,  9200, 0),
    (1, 2, '2026-11-01 09:01:20.000', TRUE,  9800, 0),
    (1, 3, '2026-11-01 09:01:40.000', FALSE, 8000, 2),
    -- play 2: Odd One Out, passes 1-3 -> score 3
    (2, 4, '2026-11-01 09:07:05.000', TRUE,  2100, 0),
    (2, 5, '2026-11-01 09:07:15.000', TRUE,  3300, 0),
    (2, 6, '2026-11-01 09:07:25.000', TRUE,  2900, 0),
    -- play 3: tired session, fails level 2 twice -> score 1
    (3, 1, '2026-11-02 21:31:05.000', TRUE,  9900, 0),
    (3, 2, '2026-11-02 21:31:20.000', FALSE, 10000, 3),
    (3, 2, '2026-11-02 21:31:40.000', FALSE, 10000, 2),
    -- play 4: Quick Match, passes 1-2 -> score 2
    (4, 7, '2026-11-01 12:11:05.000', TRUE,  1500, 0),
    (4, 8, '2026-11-01 12:11:15.000', TRUE,  1100, 1),
    -- play 5: in progress, failed level 1 so far -> score 0
    (5, 4, '2026-11-03 08:01:05.000', FALSE, 5000, 1);

-- ============================================================================
-- Simulated players, so the cohort stats queries have enough data to compare.
-- Arithmetic on the row number (MOD, DIV) stands in for randomness, so every
-- rebuild produces the same data. IDs are derived rather than auto-assigned:
--   player_id  = 100 + i                          (101-180)
--   session_id = player_id * 100 + session number (10101-18008)
--   play_id    = session_id * 10 + game_id
-- Birthdays fall between 1953 and 2008, so no simulated player is in the
-- 90-99 age group that the stats store tests use.
-- ============================================================================

INSERT INTO player (player_id, username, birthday, gender, occupation, education_level)
WITH RECURSIVE n AS (
    SELECT 1 AS i UNION ALL SELECT i + 1 FROM n WHERE i < 80
),
aged AS (
    SELECT i, birthday, TIMESTAMPDIFF(YEAR, birthday, '2026-11-01') AS age
    FROM (SELECT i, DATE_SUB('2008-06-01', INTERVAL MOD(i * 2477, 20000) DAY) AS birthday FROM n) b
)
SELECT 100 + i,
       CONCAT('sim_player_', LPAD(i, 3, '0')),
       birthday,
       ELT(1 + MOD(i * 7 + i DIV 9, 9),
           'female', 'male', 'female', 'male', 'female', 'male', 'non_binary', 'other', 'prefer_not_to_say'),
       CASE
           WHEN age < 23 AND MOD(i, 4) <> 0 THEN 'student'
           WHEN age >= 65 AND MOD(i, 3) <> 0 THEN 'retired'
           ELSE ELT(1 + MOD(i * 5 + i DIV 3, 9), 'technology', 'healthcare', 'education', 'business',
                    'trades', 'arts_media', 'service', 'unemployed', 'other')
       END,
       CASE
           WHEN MOD(i, 13) = 0 THEN NULL
           WHEN age < 20 THEN ELT(1 + MOD(i, 2), 'high_school', 'less_than_high_school')
           WHEN age < 23 THEN ELT(1 + MOD(i, 3), 'high_school', 'some_college', 'some_college')
           ELSE ELT(1 + MOD(i * 3 + i DIV 4, 7), 'less_than_high_school', 'high_school', 'some_college',
                    'associate', 'bachelor', 'master', 'doctorate')
       END
FROM aged;

-- 2 to 8 sessions each, spread over September and October 2026.
INSERT INTO session (session_id, player_id, started_at, ended_at)
SELECT session_id, player_id, started_at, started_at + INTERVAL 35 MINUTE
FROM (
    WITH RECURSIVE n AS (SELECT 1 AS s UNION ALL SELECT s + 1 FROM n WHERE s < 8)
    SELECT p.player_id * 100 + n.s AS session_id,
           p.player_id,
           TIMESTAMP('2026-09-01 07:00:00')
               + INTERVAL (n.s * 6 + MOD(p.player_id, 5)) DAY
               + INTERVAL MOD(p.player_id * 13 + n.s * 7, 15) HOUR AS started_at
    FROM player p
    JOIN n ON n.s <= 2 + MOD(p.player_id * 3, 7)
    WHERE p.player_id > 100
) planned;

-- About 4 in 5 sessions start with a check-in.
INSERT INTO check_in (session_id, hours_slept, caffeine_drinks, stress_level, exercised_today)
SELECT session_id,
       4.5 + MOD(session_id * 7, 9) * 0.5,
       MOD(session_id * 3, 5),
       1 + MOD(session_id * 11 + session_id DIV 100, 5),
       MOD(session_id + session_id DIV 100, 3) = 0
FROM session
WHERE session_id > 10000 AND MOD(session_id * 7 + session_id DIV 100, 5) <> 0;

-- Most sessions play two or three of the four games.
INSERT INTO game_play (play_id, session_id, game_id, started_at, finished_at)
SELECT se.session_id * 10 + g.game_id,
       se.session_id,
       g.game_id,
       se.started_at + INTERVAL (g.game_id * 6) MINUTE,
       se.started_at + INTERVAL (g.game_id * 6 + 5) MINUTE
FROM session se
CROSS JOIN game g
WHERE se.session_id > 10000
  AND MOD(se.session_id + g.game_id * (1 + MOD(se.player_id, 3)), 4) <> 0;

-- Each play passes levels 1..score and fails the next one (if there is one).
-- The score comes from a per-player skill plus education, practice (later
-- sessions do better), the check-in (sleep, stress, exercise), a decline with
-- age on the processing-speed game, and some noise.
--
-- Games 1-3: a level's duration is a fraction of its time limit and its errors
-- come from max_errors (a passed level stays within it, a failed one goes over).
--
-- Drift (game 4) plays differently: a level is 5 rounds, time_limit is per
-- round, and there is no max_errors, only 5 lives for the whole play.
--   * Passed level: duration is about 5 rounds' worth of time, and 0 or 1
--     mistakes. The play's first 4 mistakes are kept, so a passed level always
--     leaves a life.
--   * Failed level (only if score < 10): it ends when the last life is lost, so
--     the play's mistakes total exactly 5. It gets whatever the passed levels
--     left, and 1 to 5 rounds were played (at least one per mistake).
INSERT INTO level_attempt (play_id, level_id, started_at, passed, duration_ms, error_count)
WITH play_score AS (
    SELECT gp.play_id, gp.game_id, gp.started_at, skill,
           LEAST(gm.max_level, GREATEST(0, FLOOR((gm.max_level + 1) * (
                 0.15
               + 0.45 * skill
               + 0.03 * COALESCE(p.education_level + 0, 3)
               - IF(gp.game_id = 3, 0.004 * GREATEST(0, TIMESTAMPDIFF(YEAR, p.birthday, '2026-11-01') - 30), 0)
               + 0.03 * MOD(se.session_id, 100)
               + 0.04 * COALESCE(ci.hours_slept - 7, 0)
               - 0.03 * COALESCE(ci.stress_level - 3, 0)
               + 0.03 * COALESCE(ci.exercised_today, 0)
               + (MOD(gp.play_id * 31, 21) - 10) / 100
           )))) AS score
    FROM game_play gp
    JOIN session se ON se.session_id = gp.session_id
    JOIN (SELECT player_id, birthday, education_level, MOD(player_id * 53, 100) / 100 AS skill FROM player) p
        ON p.player_id = se.player_id
    LEFT JOIN check_in ci ON ci.session_id = se.session_id
    JOIN (SELECT game_id, MAX(level_number) AS max_level FROM level GROUP BY game_id) gm
        ON gm.game_id = gp.game_id
    WHERE gp.play_id > 100000
),
levels_played AS (
    -- One row per level the play attempted, with Drift's mistake on passed levels.
    SELECT ps.play_id, ps.game_id, ps.started_at, ps.skill, ps.score,
           l.level_id, l.level_number,
           time_limit.setting_value AS time_limit,
           max_errors.setting_value AS max_errors,
           l.level_number <= ps.score AS passed,
           IF(ps.game_id = 4 AND l.level_number <= ps.score
                  AND MOD(ps.play_id * 3 + l.level_number * 7, 3) = 0, 1, 0) AS drift_mistake
    FROM play_score ps
    JOIN level l ON l.game_id = ps.game_id AND l.level_number <= ps.score + 1
    JOIN level_setting time_limit ON time_limit.level_id = l.level_id AND time_limit.setting_type_id = 2
    LEFT JOIN level_setting max_errors ON max_errors.level_id = l.level_id AND max_errors.setting_type_id = 4
),
drift_mistakes AS (
    SELECT lp.*,
           SUM(drift_mistake) OVER (PARTITION BY play_id ORDER BY level_number) AS mistakes_through,
           LEAST(4, SUM(drift_mistake) OVER (PARTITION BY play_id))             AS mistakes_kept
    FROM levels_played lp
),
drift_errors AS (
    SELECT dm.*,
           CASE WHEN passed THEN IF(mistakes_through <= 4, drift_mistake, 0)
                ELSE 5 - mistakes_kept
           END AS drift_error_count
    FROM drift_mistakes dm
)
SELECT de.play_id,
       de.level_id,
       de.started_at + INTERVAL (de.level_number * 20) SECOND,
       de.passed,
       CASE
           WHEN de.game_id = 4
               THEN ROUND(IF(de.passed, 5, LEAST(5, GREATEST(de.drift_error_count, 1 + MOD(de.play_id, 5))))
                          * de.time_limit
                          * LEAST(0.9, 0.4 + 0.4 * (1 - de.skill) + MOD(de.play_id * 7 + de.level_number * 13, 20) / 200))
           WHEN de.passed
               THEN ROUND(de.time_limit
                          * LEAST(0.95, 0.45 + 0.4 * (1 - de.skill) + MOD(de.play_id * 7 + de.level_number * 13, 20) / 100))
           WHEN MOD(de.play_id, 2) = 0 THEN de.time_limit  -- ran out of time
           ELSE ROUND(de.time_limit * 0.8)                -- too many errors
       END,
       CASE
           WHEN de.game_id = 4 THEN de.drift_error_count
           WHEN de.passed THEN MOD(de.play_id + de.level_number, de.max_errors + 1)
           ELSE de.max_errors + 1 + MOD(de.play_id, 2)
       END
FROM drift_errors de;
