-- Brain Arcade: analysis queries (MySQL 8)
-- All queries count finished game plays only, so in-progress plays
-- don't drag averages down.

USE brain_arcade;


-- ---------------------------------------------------------------------
-- 1. Does sleep affect performance, and does the effect differ by
--    cognitive domain? Average score per game for each sleep group,
--    using the pre-session check-in.
-- ---------------------------------------------------------------------
SELECT d.name AS domain,
       g.name AS game,
       CASE
         WHEN c.hours_slept < 6 THEN 'Under 6 hours'
         WHEN c.hours_slept < 8 THEN '6 to 8 hours'
         ELSE '8+ hours'
       END AS sleep_group,
       COUNT(*) AS plays,
       ROUND(AVG(gps.score), 2) AS avg_score
FROM game_play_score gps
JOIN game_play gp       ON gp.play_id = gps.play_id
JOIN check_in c         ON c.session_id = gps.session_id
JOIN game g             ON g.game_id = gps.game_id
JOIN cognitive_domain d ON d.domain_id = g.domain_id
WHERE gp.finished_at IS NOT NULL
GROUP BY d.name, g.name, sleep_group
ORDER BY d.name, g.name, MIN(c.hours_slept);


-- ---------------------------------------------------------------------
-- 2. How does each player compare to others their age? Each player's
--    best score per game, ranked as a percentile within their age band
--    (20s, 30s, ...).
-- ---------------------------------------------------------------------
WITH best AS (
  SELECT s.player_id, gps.game_id, MAX(gps.score) AS best_score
  FROM game_play_score gps
  JOIN game_play gp ON gp.play_id = gps.play_id
  JOIN session s    ON s.session_id = gps.session_id
  WHERE gp.finished_at IS NOT NULL
  GROUP BY s.player_id, gps.game_id
),
banded AS (
  SELECT b.player_id, b.game_id, b.best_score, p.username,
         FLOOR(TIMESTAMPDIFF(YEAR, p.birthday, CURDATE()) / 10) * 10 AS age_band
  FROM best b
  JOIN player p ON p.player_id = b.player_id
)
SELECT bd.username,
       g.name AS game,
       CONCAT(bd.age_band, 's') AS age_group,
       bd.best_score,
       ROUND(100 * PERCENT_RANK() OVER (
               PARTITION BY bd.game_id, bd.age_band
               ORDER BY bd.best_score), 0) AS percentile
FROM banded bd
JOIN game g ON g.game_id = bd.game_id
ORDER BY g.name, bd.age_band, percentile DESC;


-- ---------------------------------------------------------------------
-- 3. Which players show a possible decline? Players whose most recent
--    score on a game is at least 2 levels below their own average on
--    that game's earlier plays (requires 3+ earlier plays).
-- ---------------------------------------------------------------------
WITH plays AS (
  SELECT s.player_id, gp.game_id, gps.score,
         ROW_NUMBER() OVER (PARTITION BY s.player_id, gp.game_id
                            ORDER BY gp.started_at DESC) AS recency
  FROM game_play gp
  JOIN session s           ON s.session_id = gp.session_id
  JOIN game_play_score gps ON gps.play_id = gp.play_id
  WHERE gp.finished_at IS NOT NULL
),
latest AS (
  SELECT player_id, game_id, score
  FROM plays
  WHERE recency = 1
),
history AS (
  SELECT player_id, game_id, AVG(score) AS avg_prev, COUNT(*) AS prev_plays
  FROM plays
  WHERE recency > 1
  GROUP BY player_id, game_id
  HAVING COUNT(*) >= 3
)
SELECT p.username,
       g.name AS game,
       l.score AS latest_score,
       ROUND(h.avg_prev, 2) AS previous_avg,
       h.prev_plays,
       ROUND(h.avg_prev - l.score, 2) AS levels_below_avg
FROM latest l
JOIN history h ON h.player_id = l.player_id AND h.game_id = l.game_id
JOIN player p  ON p.player_id = l.player_id
JOIN game g    ON g.game_id = l.game_id
WHERE l.score <= h.avg_prev - 2
ORDER BY levels_below_avg DESC;


-- ---------------------------------------------------------------------
-- 4. Which level is the biggest difficulty jump in each game? Pass rate
--    and average completion time per level, alongside the level's
--    settings, with the drop in pass rate from the previous level.
-- ---------------------------------------------------------------------
WITH level_stats AS (
  SELECT l.game_id, l.level_id, l.level_number,
         COUNT(la.attempt_id) AS attempts,
         AVG(la.passed) AS pass_rate,
         AVG(CASE WHEN la.passed THEN la.duration_ms END) AS avg_pass_ms
  FROM `level` l
  LEFT JOIN level_attempt la ON la.level_id = l.level_id
  GROUP BY l.game_id, l.level_id, l.level_number
),
settings AS (
  SELECT ls.level_id,
         GROUP_CONCAT(CONCAT(st.name, ' = ', ls.setting_value, ' ', st.unit)
                      ORDER BY st.name SEPARATOR ', ') AS config
  FROM level_setting ls
  JOIN setting_type st ON st.setting_type_id = ls.setting_type_id
  GROUP BY ls.level_id
)
SELECT g.name AS game,
       s.level_number,
       cfg.config,
       s.attempts,
       ROUND(100 * s.pass_rate, 1) AS pass_pct,
       ROUND(100 * (LAG(s.pass_rate) OVER (PARTITION BY s.game_id
                                           ORDER BY s.level_number)
                    - s.pass_rate), 1) AS pass_pct_drop_from_prev,
       ROUND(s.avg_pass_ms / 1000, 1) AS avg_seconds_when_passed
FROM level_stats s
JOIN game g          ON g.game_id = s.game_id
LEFT JOIN settings cfg ON cfg.level_id = s.level_id
ORDER BY g.name, s.level_number;


-- ---------------------------------------------------------------------
-- 5. Which players are well-rounded? Players whose best score is above
--    the population average on EVERY game (relational division using
--    a double NOT EXISTS: there is no game where they fail to beat
--    the average).
-- ---------------------------------------------------------------------
WITH best AS (
  SELECT s.player_id, gps.game_id, MAX(gps.score) AS best_score
  FROM game_play_score gps
  JOIN game_play gp ON gp.play_id = gps.play_id
  JOIN session s    ON s.session_id = gps.session_id
  WHERE gp.finished_at IS NOT NULL
  GROUP BY s.player_id, gps.game_id
),
game_avg AS (
  SELECT game_id, AVG(best_score) AS avg_best
  FROM best
  GROUP BY game_id
)
SELECT p.username,
       (SELECT SUM(b.best_score) FROM best b
        WHERE b.player_id = p.player_id) AS total_best_levels
FROM player p
WHERE NOT EXISTS (
  SELECT 1
  FROM game g
  WHERE NOT EXISTS (
    SELECT 1
    FROM best b
    JOIN game_avg ga ON ga.game_id = b.game_id
    WHERE b.player_id = p.player_id
      AND b.game_id = g.game_id
      AND b.best_score > ga.avg_best
  )
)
ORDER BY total_best_levels DESC;


-- ---------------------------------------------------------------------
-- 6. Does caffeine make up for lost sleep? Average performance for each
--    combination of sleep and caffeine. Scores are converted to a
--    percentage of each game's highest level so games with different
--    numbers of levels can be combined.
-- ---------------------------------------------------------------------
SELECT CASE WHEN c.hours_slept < 6 THEN 'Under 6 hours' ELSE '6+ hours' END AS sleep_group,
       CASE WHEN c.caffeine_drinks = 0 THEN 'No caffeine' ELSE 'Caffeine' END AS caffeine_group,
       COUNT(*) AS plays,
       ROUND(100 * AVG(gps.score / ml.max_level), 1) AS avg_pct_of_max_level
FROM game_play_score gps
JOIN game_play gp ON gp.play_id = gps.play_id
JOIN check_in c   ON c.session_id = gps.session_id
JOIN (
  SELECT game_id, MAX(level_number) AS max_level
  FROM `level`
  GROUP BY game_id
) ml ON ml.game_id = gps.game_id
WHERE gp.finished_at IS NOT NULL
GROUP BY sleep_group, caffeine_group
ORDER BY sleep_group, caffeine_group;