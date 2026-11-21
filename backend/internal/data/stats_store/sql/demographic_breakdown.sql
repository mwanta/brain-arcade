-- The cohort split into groups by one attribute (group_by: age_group, gender,
-- occupation or education_level), ranked by average score on each game.
SELECT game_id, g.name AS game_name, group_value, group_size, group_avg_score, group_rank, is_player_group
FROM (
    SELECT game_id,
           profile_attribute(player_id, %(group_by)s) AS group_value,
           COUNT(*)       AS group_size,
           AVG(avg_score) AS group_avg_score,
           MAX(is_me)     AS is_player_group,
           RANK() OVER (PARTITION BY game_id ORDER BY AVG(avg_score) DESC) AS group_rank
    FROM cohort_player_game
    GROUP BY game_id, group_value
) grouped
JOIN game g USING (game_id)
ORDER BY g.name, group_rank, group_value
