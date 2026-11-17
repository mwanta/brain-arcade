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

DELIMITER ;
