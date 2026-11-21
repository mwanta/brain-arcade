-- How the player's average score on each game ranks within their cohort.
-- percentile = the fraction of the other members with a lower average.
SELECT game_id, g.name AS game_name, plays,
       avg_score  AS player_avg_score,
       best_score AS player_best_score,
       cohort_size, cohort_avg_score, cohort_rank, percentile
FROM (
    SELECT cpg.*,
           COUNT(*)       OVER per_game                         AS cohort_size,
           AVG(avg_score) OVER per_game                         AS cohort_avg_score,
           RANK()         OVER (per_game ORDER BY avg_score DESC) AS cohort_rank,
           PERCENT_RANK() OVER (per_game ORDER BY avg_score)      AS percentile
    FROM cohort_player_game cpg
    WINDOW per_game AS (PARTITION BY game_id)
) ranked
JOIN game g USING (game_id)
WHERE is_me
ORDER BY g.name
