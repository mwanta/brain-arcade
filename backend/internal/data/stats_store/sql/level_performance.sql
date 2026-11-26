-- For each level the player attempted: their pass rate, errors and speed (on
-- passed attempts) next to the cohort's, plus the level's settings (level_rule).
-- pass_rate_percentile = the fraction of other members with a lower pass rate.
WITH per_member AS (
    SELECT cp.player_id, cp.is_me, l.game_id, l.level_id, l.level_number,
           COUNT(*)                                         AS attempts,
           AVG(la.passed)                                   AS pass_rate,
           AVG(la.error_count)                              AS avg_errors,
           AVG(CASE WHEN la.passed THEN la.duration_ms END) AS avg_pass_ms
    FROM cohort_play cp
    JOIN level_attempt la ON la.play_id = cp.play_id
    JOIN level l          ON l.level_id = la.level_id
    GROUP BY cp.player_id, cp.is_me, l.game_id, l.level_id, l.level_number
),
ranked AS (
    SELECT per_member.*,
           COUNT(*)         OVER per_level                       AS cohort_players,
           AVG(pass_rate)   OVER per_level                       AS cohort_pass_rate,
           AVG(avg_errors)  OVER per_level                       AS cohort_avg_errors,
           AVG(avg_pass_ms) OVER per_level                       AS cohort_avg_pass_ms,
           PERCENT_RANK()   OVER (per_level ORDER BY pass_rate)  AS pass_rate_percentile
    FROM per_member
    WINDOW per_level AS (PARTITION BY level_id)
)
SELECT r.game_id, g.name AS game_name, r.level_number,
       lr.settings, lr.trial_count,
       r.attempts, r.pass_rate, r.avg_errors, r.avg_pass_ms,
       r.cohort_players, r.cohort_pass_rate, r.cohort_avg_errors, r.cohort_avg_pass_ms,
       r.pass_rate_percentile
FROM ranked r
JOIN game g              ON g.game_id = r.game_id
LEFT JOIN level_rule lr  ON lr.level_id = r.level_id
WHERE r.is_me
ORDER BY g.name, r.level_number
