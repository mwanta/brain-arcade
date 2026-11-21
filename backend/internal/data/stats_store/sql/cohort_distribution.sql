-- How many cohort members have each best score on each game, and the
-- percentile range that score covers: 0.40-0.65 means 40 of every 100 members
-- did worse and 25 of every 100 have exactly this best score.
SELECT game_id, g.name AS game_name, score, members,
       (at_or_below - members) / cohort_size AS percentile_low,
       at_or_below / cohort_size             AS percentile_high,
       is_player_best
FROM (
    SELECT game_id, best_score AS score,
           COUNT(*)   AS members,
           MAX(is_me) AS is_player_best,
           SUM(COUNT(*)) OVER (PARTITION BY game_id ORDER BY best_score) AS at_or_below,
           SUM(COUNT(*)) OVER (PARTITION BY game_id)                     AS cohort_size
    FROM cohort_player_game
    GROUP BY game_id, best_score
) buckets
JOIN game g USING (game_id)
ORDER BY g.name, score
