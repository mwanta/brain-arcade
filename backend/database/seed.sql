USE brain_arcade;

-- ---- players ----------------------------------------------------------------
INSERT INTO player (username, birthday, gender) VALUES
    ('ada_lovelace',  '1995-12-10', 'female'),
    ('alan_turing',   '1992-06-23', 'male'),
    ('grace_hopper',  '1990-12-09', 'female'),
    ('sam_rivera',    '2001-03-15', 'non_binary'),
    ('casual_player', '2006-05-10', 'prefer_not_to_say');

-- ---- game catalog -----------------------------------------------------------
INSERT INTO cognitive_domain (domain_id, name, description) VALUES
    (1, 'memory',                'Holding and recalling information over short periods.'),
    (2, 'attention',             'Staying focused on relevant items while ignoring distractions.'),
    (3, 'processing_speed',      'How quickly simple tasks are completed accurately.'),
    (4, 'cognitive_flexibility', 'Switching between rules or tasks quickly and accurately.');

INSERT INTO game (game_id, domain_id, name, instructions) VALUES
    (1, 1, 'Sequence Recall', 'Watch the tiles light up, then tap them back in the same order.'),
    (2, 2, 'Odd One Out',     'Tap the single shape that differs from the rest before time runs out.'),
    (3, 3, 'Quick Match',     'Decide as fast as you can whether the two symbols match.'),
    (4, 4, 'Drift',           'Follow the car with its headlights on. If it is driving, swipe the way it faces. If it is drifting, with tire smoke and skid marks, swipe the way it moves across the screen.');

INSERT INTO setting_type (setting_type_id, name, unit, description) VALUES
    (1,  'sequence_length',     'items',  'Number of items the player must remember.'),
    (2,  'time_limit',          'ms',     'Time allowed to answer; slower counts as a fail.'),
    (3,  'grid_size',           'cells',  'Number of cells on the board.'),
    (4,  'max_errors',          'errors', 'Most errors allowed while still passing the level.'),
    (5,  'trial_count',         'trials', 'Number of trials in the level.'),
    (6,  'switch_probability',  'ratio',  'Chance the lit car switches between driving and drifting from one trial to the next.'),
    (7,  'car_count',           'cars',   'Cars on the road at once.'),
    (8,  'move_speed',          'px/s',   'How fast the cars move across the screen.'),
    (9,  'conflict_ratio',      'ratio',  'Share of trials where the lit car''s facing and movement directions differ.'),
    (10, 'mixed_traffic',       'flag',   '0: all cars are lit and identical. 1: only one car is lit; the others are distractors.');

INSERT INTO level (level_id, game_id, level_number) VALUES
    (1, 1, 1), (2, 1, 2), (3, 1, 3),
    (4, 2, 1), (5, 2, 2), (6, 2, 3),
    (7, 3, 1), (8, 3, 2),
    (9, 4, 1),  (10, 4, 2), (11, 4, 3), (12, 4, 4), (13, 4, 5),
    (14, 4, 6), (15, 4, 7), (16, 4, 8), (17, 4, 9), (18, 4, 10);

INSERT INTO level_setting (level_id, setting_type_id, setting_value) VALUES
    -- Sequence Recall: longer sequences, no errors allowed
    (1, 1, 3),  (1, 2, 10000), (1, 4, 0),
    (2, 1, 5),  (2, 2, 10000), (2, 4, 0),
    (3, 1, 7),  (3, 2,  8000), (3, 4, 0),
    -- Odd One Out: bigger grids, less time, no errors allowed
    (4, 3, 9),  (4, 2, 5000),  (4, 4, 0),
    (5, 3, 16), (5, 2, 4000),  (5, 4, 0),
    (6, 3, 25), (6, 2, 3000),  (6, 4, 0),
    -- Quick Match: less time, fewer errors allowed
    (7, 2, 2000), (7, 4, 2),
    (8, 2, 1200), (8, 4, 1),
    -- Drift, levels 1-5 (all cars lit): more cars, faster, more switching and conflict, less time
    -- columns: time_limit, max_errors, trial_count, switch_probability, car_count, move_speed, conflict_ratio, mixed_traffic
    (9,  2, 3000), (9,  4, 4), (9,  5, 20), (9,  6, 0.20), (9,  7, 1), (9,  8,  60), (9,  9, 0.30), (9, 10, 0),
    (10, 2, 2800), (10, 4, 4), (10, 5, 20), (10, 6, 0.25), (10, 7, 2), (10, 8,  70), (10, 9, 0.35), (10, 10, 0),
    (11, 2, 2600), (11, 4, 4), (11, 5, 24), (11, 6, 0.30), (11, 7, 3), (11, 8,  80), (11, 9, 0.40), (11, 10, 0),
    (12, 2, 2400), (12, 4, 3), (12, 5, 24), (12, 6, 0.35), (12, 7, 4), (12, 8,  90), (12, 9, 0.45), (12, 10, 0),
    (13, 2, 2200), (13, 4, 3), (13, 5, 28), (13, 6, 0.40), (13, 7, 5), (13, 8, 100), (13, 9, 0.50), (13, 10, 0),
    -- Drift, levels 6-10 (mixed traffic: one lit car among distractors); level 6 eases back, then ramps again
    (14, 2, 2600), (14, 4, 4), (14, 5, 24), (14, 6, 0.40), (14, 7, 3), (14, 8,  80), (14, 9, 0.50), (14, 10, 1),
    (15, 2, 2400), (15, 4, 4), (15, 5, 28), (15, 6, 0.45), (15, 7, 4), (15, 8,  90), (15, 9, 0.55), (15, 10, 1),
    (16, 2, 2200), (16, 4, 3), (16, 5, 28), (16, 6, 0.50), (16, 7, 5), (16, 8, 100), (16, 9, 0.60), (16, 10, 1),
    (17, 2, 2000), (17, 4, 3), (17, 5, 32), (17, 6, 0.55), (17, 7, 6), (17, 8, 110), (17, 9, 0.65), (17, 10, 1),
    (18, 2, 1800), (18, 4, 2), (18, 5, 32), (18, 6, 0.60), (18, 7, 7), (18, 8, 120), (18, 9, 0.70), (18, 10, 1);

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
