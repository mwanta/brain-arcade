-- Brain Arcade schema. Safe to re-run: drops and recreates the database.
-- Run through the mysql client (scripts/db_rebuild.sh); the DELIMITER lines
-- for triggers are a client command, not SQL.
DROP DATABASE IF EXISTS brain_arcade;
CREATE DATABASE brain_arcade CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE brain_arcade;

-- Delete rules: data a player generates (sessions, check-ins, plays, attempts)
-- CASCADEs when its parent is deleted. Game catalog rows (domains, games,
-- levels, setting types) RESTRICT, so they can't be deleted while referenced.

-- ============================================================================
-- Players
-- ============================================================================

CREATE TABLE player (
    player_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    birthday DATE NOT NULL,
    gender ENUM('female', 'male', 'non_binary', 'other', 'prefer_not_to_say') NULL,
    occupation ENUM('student', 'technology', 'healthcare', 'education', 'business', 'trades',
                    'arts_media', 'service', 'retired', 'unemployed', 'other') NULL,
    -- Listed lowest to highest: education_level + 0 is the ENUM index (1-7), so
    -- stats queries can filter "at least a bachelor's" with a numeric comparison.
    education_level ENUM('less_than_high_school', 'high_school', 'some_college', 'associate',
                         'bachelor', 'master', 'doctorate') NULL,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE session (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    player_id  INT      NOT NULL,
    started_at DATETIME NOT NULL DEFAULT NOW(),
    ended_at   DATETIME NULL,
    CONSTRAINT fk_session_player FOREIGN KEY (player_id)
        REFERENCES player (player_id) ON DELETE CASCADE,
    CONSTRAINT chk_session_times CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- At most one check-in per session (session_id is UNIQUE).
CREATE TABLE check_in (
    check_in_id     INT PRIMARY KEY AUTO_INCREMENT,
    session_id      INT          NOT NULL UNIQUE,
    hours_slept     DECIMAL(3,1) NULL,
    caffeine_drinks INT          NULL,
    stress_level    TINYINT      NULL,
    exercised_today BOOL         NULL,
    CONSTRAINT fk_check_in_session FOREIGN KEY (session_id)
        REFERENCES session (session_id) ON DELETE CASCADE,
    CONSTRAINT chk_check_in_hours_slept CHECK (hours_slept BETWEEN 0 AND 24),
    CONSTRAINT chk_check_in_caffeine    CHECK (caffeine_drinks >= 0),
    CONSTRAINT chk_check_in_stress      CHECK (stress_level BETWEEN 1 AND 5)
);

-- ============================================================================
-- Game catalog
-- ============================================================================

CREATE TABLE cognitive_domain (
    domain_id   INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(50) NOT NULL UNIQUE,  -- memory, attention, ...
    description TEXT        NULL
);

CREATE TABLE game (
    game_id      INT PRIMARY KEY AUTO_INCREMENT,
    domain_id    INT          NOT NULL,
    name         VARCHAR(100) NOT NULL UNIQUE,
    instructions TEXT         NULL,
    CONSTRAINT fk_game_domain FOREIGN KEY (domain_id)
        REFERENCES cognitive_domain (domain_id) ON DELETE RESTRICT
);

-- A level's difficulty and pass rules are rows in level_setting
-- (e.g. sequence_length, time_limit, max_errors), not columns here.
CREATE TABLE level (
    level_id     INT PRIMARY KEY AUTO_INCREMENT,
    game_id      INT NOT NULL,
    level_number INT NOT NULL,
    CONSTRAINT uq_level_game_number UNIQUE (game_id, level_number),
    CONSTRAINT fk_level_game FOREIGN KEY (game_id)
        REFERENCES game (game_id) ON DELETE RESTRICT,
    CONSTRAINT chk_level_number CHECK (level_number >= 1)
);

CREATE TABLE setting_type (
    setting_type_id INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(50) NOT NULL UNIQUE,  -- sequence_length, time_limit, max_errors, ...
    unit            VARCHAR(20) NULL,             -- items, ms, ...
    description     TEXT        NULL
);

CREATE TABLE level_setting (
    level_id        INT           NOT NULL,
    setting_type_id INT           NOT NULL,
    setting_value   DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (level_id, setting_type_id),
    CONSTRAINT fk_level_setting_level FOREIGN KEY (level_id)
        REFERENCES level (level_id) ON DELETE CASCADE,
    CONSTRAINT fk_level_setting_type FOREIGN KEY (setting_type_id)
        REFERENCES setting_type (setting_type_id) ON DELETE RESTRICT
);

-- ============================================================================
-- Gameplay
-- ============================================================================

CREATE TABLE game_play (
    play_id     INT PRIMARY KEY AUTO_INCREMENT,
    session_id  INT      NOT NULL,
    game_id     INT      NOT NULL,
    started_at  DATETIME NOT NULL DEFAULT NOW(),
    finished_at DATETIME NULL,
    CONSTRAINT fk_game_play_session FOREIGN KEY (session_id)
        REFERENCES session (session_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_play_game FOREIGN KEY (game_id)
        REFERENCES game (game_id) ON DELETE RESTRICT,
    CONSTRAINT chk_game_play_times CHECK (finished_at IS NULL OR finished_at >= started_at)
);

-- `passed` is the outcome recorded at play time, judged against the level's
-- settings then. It is stored (not derived) so later setting changes don't
-- rewrite history.
CREATE TABLE level_attempt (
    attempt_id  INT PRIMARY KEY AUTO_INCREMENT,
    play_id     INT         NOT NULL,
    level_id    INT         NOT NULL,
    started_at  DATETIME(3) NOT NULL DEFAULT NOW(3),  -- orders attempts within a play
    passed      BOOL        NOT NULL,
    duration_ms INT         NULL,
    error_count INT         NULL,
    CONSTRAINT fk_level_attempt_play FOREIGN KEY (play_id)
        REFERENCES game_play (play_id) ON DELETE CASCADE,
    CONSTRAINT fk_level_attempt_level FOREIGN KEY (level_id)
        REFERENCES level (level_id) ON DELETE RESTRICT,
    CONSTRAINT chk_level_attempt_duration CHECK (duration_ms >= 0),
    CONSTRAINT chk_level_attempt_errors   CHECK (error_count >= 0),
    INDEX idx_level_attempt_play_order (play_id, started_at)
);

-- ============================================================================
-- Views
-- ============================================================================

-- Score = highest level_number passed in the play (0 if none passed).
CREATE VIEW game_play_score AS
SELECT gp.play_id,
       gp.session_id,
       gp.game_id,
       COALESCE(MAX(CASE WHEN la.passed THEN l.level_number END), 0) AS score
FROM game_play gp
LEFT JOIN level_attempt la USING (play_id)
LEFT JOIN level l USING (level_id)
GROUP BY gp.play_id, gp.session_id, gp.game_id;

-- A player's demographics with current age and age decade (e.g. '30-39').
CREATE VIEW player_profile AS
SELECT player_id, gender, occupation, education_level,
       TIMESTAMPDIFF(YEAR, birthday, CURDATE()) AS age,
       CONCAT(FLOOR(TIMESTAMPDIFF(YEAR, birthday, CURDATE()) / 10) * 10, '-',
              FLOOR(TIMESTAMPDIFF(YEAR, birthday, CURDATE()) / 10) * 10 + 9) AS age_group
FROM player;

-- Finished plays only, with the player and two scores: `score` (highest level
-- passed) and `completion` (score / the game's top level, 0 to 1), which can
-- be averaged across games with different numbers of levels.
CREATE VIEW finished_play AS
SELECT se.player_id, gp.play_id, gp.session_id, gp.game_id, gp.started_at,
       s.score, s.score / top.top_level AS completion
FROM game_play gp
JOIN session se        ON se.session_id = gp.session_id
JOIN game_play_score s ON s.play_id = gp.play_id
JOIN (SELECT game_id, MAX(level_number) AS top_level FROM level GROUP BY game_id) top
    ON top.game_id = gp.game_id
WHERE gp.finished_at IS NOT NULL;

-- Each level's time limit and error allowance as columns.
CREATE VIEW level_rule AS
SELECT ls.level_id,
       MAX(CASE WHEN st.name = 'time_limit' THEN ls.setting_value END) AS time_limit_ms,
       MAX(CASE WHEN st.name = 'max_errors' THEN ls.setting_value END) AS max_errors
FROM level_setting ls
JOIN setting_type st ON st.setting_type_id = ls.setting_type_id
GROUP BY ls.level_id;

-- Check-in answers sorted into buckets: one row per session and factor.
CREATE VIEW check_in_factor AS
SELECT session_id, 'sleep' AS factor,
       CASE WHEN hours_slept < 6 THEN 'under_6h' WHEN hours_slept < 8 THEN '6_to_8h' ELSE '8h_plus' END AS bucket,
       CASE WHEN hours_slept < 6 THEN 1 WHEN hours_slept < 8 THEN 2 ELSE 3 END AS bucket_order
FROM check_in WHERE hours_slept IS NOT NULL
UNION ALL
SELECT session_id, 'caffeine',
       CASE WHEN caffeine_drinks = 0 THEN 'none' WHEN caffeine_drinks <= 2 THEN '1_to_2' ELSE '3_plus' END,
       CASE WHEN caffeine_drinks = 0 THEN 1 WHEN caffeine_drinks <= 2 THEN 2 ELSE 3 END
FROM check_in WHERE caffeine_drinks IS NOT NULL
UNION ALL
SELECT session_id, 'stress',
       CASE WHEN stress_level <= 2 THEN 'low' WHEN stress_level = 3 THEN 'medium' ELSE 'high' END,
       CASE WHEN stress_level <= 2 THEN 1 WHEN stress_level = 3 THEN 2 ELSE 3 END
FROM check_in WHERE stress_level IS NOT NULL
UNION ALL
SELECT session_id, 'exercise',
       IF(exercised_today, 'exercised', 'did_not_exercise'),
       IF(exercised_today, 2, 1)
FROM check_in WHERE exercised_today IS NOT NULL;

-- ============================================================================
-- Triggers: a level attempt's level must belong to the same game as its play.
-- The game_play / level update guards stop the rule being broken afterwards
-- by moving a play or level to another game.
-- ============================================================================

DELIMITER //

CREATE TRIGGER trg_level_attempt_same_game_insert
BEFORE INSERT ON level_attempt
FOR EACH ROW
BEGIN
    IF (SELECT game_id FROM level WHERE level_id = NEW.level_id)
       <> (SELECT game_id FROM game_play WHERE play_id = NEW.play_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'level_attempt: level must belong to the same game as the game_play';
    END IF;
END//

CREATE TRIGGER trg_level_attempt_same_game_update
BEFORE UPDATE ON level_attempt
FOR EACH ROW
BEGIN
    IF (SELECT game_id FROM level WHERE level_id = NEW.level_id)
       <> (SELECT game_id FROM game_play WHERE play_id = NEW.play_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'level_attempt: level must belong to the same game as the game_play';
    END IF;
END//

CREATE TRIGGER trg_game_play_game_locked
BEFORE UPDATE ON game_play
FOR EACH ROW
BEGIN
    IF NEW.game_id <> OLD.game_id
       AND EXISTS (SELECT 1 FROM level_attempt WHERE play_id = OLD.play_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'game_play: cannot change game_id once it has level attempts';
    END IF;
END//

CREATE TRIGGER trg_level_game_locked
BEFORE UPDATE ON level
FOR EACH ROW
BEGIN
    IF NEW.game_id <> OLD.game_id
       AND EXISTS (SELECT 1 FROM level_attempt WHERE level_id = OLD.level_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'level: cannot change game_id once it has level attempts';
    END IF;
END//

-- ============================================================================
-- Functions and procedures for the cohort stats queries
-- (backend/internal/data/stats_store/sql/cohort_*.sql and friends).
-- ============================================================================

-- TRUE if t is inside the half-open range [p_start, p_end); a NULL bound is open.
CREATE FUNCTION in_period(t DATETIME, p_start DATETIME, p_end DATETIME)
RETURNS BOOL
DETERMINISTIC NO SQL
RETURN (p_start IS NULL OR t >= p_start) AND (p_end IS NULL OR t < p_end)//

-- One of a player's attributes by name: 'age_group', 'gender', 'occupation' or
-- 'education_level'. Missing values come back as 'unspecified'.
CREATE FUNCTION profile_attribute(p_player_id INT, p_attribute VARCHAR(20))
RETURNS VARCHAR(30)
READS SQL DATA
RETURN (
    SELECT COALESCE(CASE p_attribute
                        WHEN 'age_group'       THEN age_group
                        WHEN 'gender'          THEN gender
                        WHEN 'occupation'      THEN occupation
                        WHEN 'education_level' THEN education_level
                    END, 'unspecified')
    FROM player_profile
    WHERE player_id = p_player_id
)//

-- Fills three temporary tables (private to this connection) describing the
-- players to compare p_player_id with. Every filter is optional: NULL (or ''
-- for p_match) switches it off. The player is always part of their own cohort.
--   p_gender, p_occupation, p_education_level  comma-separated allow-lists
--   p_education_min/max  ENUM index bounds (1 = less_than_high_school)
--   p_age_min/max        current age, inclusive
--   p_match              attributes that must equal the player's, e.g. 'age_group,occupation'
--   p_min_plays          plays of a game a member needs to count for that game
--
--   cohort_member       (player_id, is_me)
--   cohort_play         finished plays by members in the period, on games the
--                       player played in the period: finished_play columns + is_me
--   cohort_player_game  (player_id, game_id, is_me, plays, avg_score, best_score)
CREATE PROCEDURE load_cohort(
    IN p_player_id INT,
    IN p_game_id INT, IN p_start DATETIME, IN p_end DATETIME,
    IN p_gender VARCHAR(100), IN p_occupation VARCHAR(200), IN p_education_level VARCHAR(200),
    IN p_education_min INT, IN p_education_max INT,
    IN p_age_min INT, IN p_age_max INT,
    IN p_match VARCHAR(100), IN p_min_plays INT
)
BEGIN
    SET p_match = COALESCE(p_match, '');
    DROP TEMPORARY TABLE IF EXISTS cohort_member, cohort_play, cohort_player_game;

    -- 1. Members: the player, plus everyone who passes every active filter.
    CREATE TEMPORARY TABLE cohort_member AS
    SELECT p.player_id, p.player_id = p_player_id AS is_me
    FROM player_profile p
    JOIN player_profile me ON me.player_id = p_player_id
    WHERE p.player_id = p_player_id
       OR (    (p_gender IS NULL          OR FIND_IN_SET(p.gender, p_gender))
           AND (p_occupation IS NULL      OR FIND_IN_SET(p.occupation, p_occupation))
           AND (p_education_level IS NULL OR FIND_IN_SET(p.education_level, p_education_level))
           AND (p_education_min IS NULL   OR p.education_level + 0 >= p_education_min)
           AND (p_education_max IS NULL   OR p.education_level + 0 <= p_education_max)
           AND (p_age_min IS NULL         OR p.age >= p_age_min)
           AND (p_age_max IS NULL         OR p.age <= p_age_max)
           AND (NOT FIND_IN_SET('age_group', p_match)       OR p.age_group = me.age_group)
           AND (NOT FIND_IN_SET('gender', p_match)          OR p.gender = me.gender)
           AND (NOT FIND_IN_SET('occupation', p_match)      OR p.occupation = me.occupation)
           AND (NOT FIND_IN_SET('education_level', p_match) OR p.education_level = me.education_level));

    -- 2. Their plays in the period, limited to the games the player played then.
    CREATE TEMPORARY TABLE cohort_play AS
    SELECT fp.*, m.is_me
    FROM finished_play fp
    JOIN cohort_member m ON m.player_id = fp.player_id
    WHERE in_period(fp.started_at, p_start, p_end)
      AND (p_game_id IS NULL OR fp.game_id = p_game_id)
      AND fp.game_id IN (SELECT game_id FROM finished_play
                         WHERE player_id = p_player_id AND in_period(started_at, p_start, p_end));

    -- 3. Per member and game. Members under p_min_plays drop out of that game.
    CREATE TEMPORARY TABLE cohort_player_game AS
    SELECT player_id, game_id, is_me,
           COUNT(*) AS plays, AVG(score) AS avg_score, MAX(score) AS best_score
    FROM cohort_play
    GROUP BY player_id, game_id, is_me
    HAVING COUNT(*) >= p_min_plays OR is_me;

    DELETE cp FROM cohort_play cp
    LEFT JOIN cohort_player_game cpg ON cpg.player_id = cp.player_id AND cpg.game_id = cp.game_id
    WHERE cpg.player_id IS NULL;
END//

DELIMITER ;
