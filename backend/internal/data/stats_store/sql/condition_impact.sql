-- Average completion (share of a game's levels passed) in each check-in bucket,
-- for the player and for their peers. Plays without a check-in are left out.
SELECT f.factor, f.bucket,
       SUM(NOT cp.is_me)                                  AS peer_plays,
       AVG(CASE WHEN NOT cp.is_me THEN cp.completion END) AS peer_avg_completion,
       SUM(cp.is_me)                                      AS player_plays,
       AVG(CASE WHEN cp.is_me THEN cp.completion END)     AS player_avg_completion
FROM cohort_play cp
JOIN check_in_factor f ON f.session_id = cp.session_id
GROUP BY f.factor, f.bucket, f.bucket_order
ORDER BY FIELD(f.factor, 'sleep', 'caffeine', 'stress', 'exercise'), f.bucket_order
