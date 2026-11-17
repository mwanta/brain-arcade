-- For each game the player played, compare their average score with every player in
-- the same age decade (e.g. 20-29, by current age) who played that game in the period.
-- percentile = PERCENT_RANK: the fraction of the *other* group members with a lower average.
WITH player_game AS (
    SELECT se.player_id, gp.game_id, AVG(s.score) AS avg_score
    FROM game_play gp
    JOIN session se        ON se.session_id = gp.session_id
    JOIN game_play_score s ON s.play_id = gp.play_id
    WHERE gp.finished_at IS NOT NULL
      AND (%(game_id)s IS NULL OR gp.game_id = %(game_id)s)
      AND (%(start)s IS NULL OR gp.started_at >= %(start)s)
      AND (%(end)s IS NULL OR gp.started_at < %(end)s)
    GROUP BY se.player_id, gp.game_id
),
grouped AS (
    SELECT pg.player_id, pg.game_id, pg.avg_score,
           FLOOR(TIMESTAMPDIFF(YEAR, p.birthday, CURDATE()) / 10) * 10 AS age_group_start
    FROM player_game pg
    JOIN player p ON p.player_id = pg.player_id
),
ranked AS (
    SELECT gr.*,
           AVG(gr.avg_score) OVER grp AS age_group_avg_score,
           COUNT(*)          OVER grp AS age_group_player_count,
           PERCENT_RANK()    OVER (PARTITION BY gr.game_id, gr.age_group_start ORDER BY gr.avg_score) AS percentile
    FROM grouped gr
    WINDOW grp AS (PARTITION BY gr.game_id, gr.age_group_start)
)
SELECT r.game_id, g.name AS game_name, r.age_group_start,
       r.avg_score AS player_avg_score, r.age_group_avg_score,
       r.age_group_player_count, r.percentile
FROM ranked r
JOIN game g ON g.game_id = r.game_id
WHERE r.player_id = %(player_id)s
ORDER BY g.name
