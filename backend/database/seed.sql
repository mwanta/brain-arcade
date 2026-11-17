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
    (1, 'memory',           'Holding and recalling information over short periods.'),
    (2, 'attention',        'Staying focused on relevant items while ignoring distractions.'),
    (3, 'processing_speed', 'How quickly simple tasks are completed accurately.');

INSERT INTO game (game_id, domain_id, name, instructions) VALUES
    (1, 1, 'Sequence Recall', 'Watch the tiles light up, then tap them back in the same order.'),
    (2, 2, 'Odd One Out',     'Tap the single shape that differs from the rest before time runs out.'),
    (3, 3, 'Quick Match',     'Decide as fast as you can whether the two symbols match.');

INSERT INTO setting_type (setting_type_id, name, unit, description) VALUES
    (1, 'sequence_length', 'items',  'Number of items the player must remember.'),
    (2, 'time_limit',      'ms',     'Time allowed to answer; slower counts as a fail.'),
    (3, 'grid_size',       'cells',  'Number of cells on the board.'),
    (4, 'max_errors',      'errors', 'Most errors allowed while still passing the level.');

INSERT INTO level (level_id, game_id, level_number) VALUES
    (1, 1, 1), (2, 1, 2), (3, 1, 3),
    (4, 2, 1), (5, 2, 2), (6, 2, 3),
    (7, 3, 1), (8, 3, 2);

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
    (8, 2, 1200), (8, 4, 1);

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
