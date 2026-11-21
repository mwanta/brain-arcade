-- The player's score on their 1st, 2nd, 3rd... play of each game, next to the
-- average of their peers' (other members') plays with the same number.
WITH numbered AS (
    SELECT game_id, is_me, score,
           ROW_NUMBER() OVER (PARTITION BY player_id, game_id ORDER BY started_at, play_id) AS play_number
    FROM cohort_play
)
SELECT game_id, g.name AS game_name, play_number,
       MAX(CASE WHEN is_me THEN score END)     AS player_score,
       AVG(CASE WHEN NOT is_me THEN score END) AS peer_avg_score,
       SUM(NOT is_me)                          AS peer_players
FROM numbered
JOIN game g USING (game_id)
WHERE play_number <= %(max_play_number)s
GROUP BY game_id, g.name, play_number
ORDER BY g.name, play_number
