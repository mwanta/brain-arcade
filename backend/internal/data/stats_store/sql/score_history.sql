-- A player's finished plays in time order, with each play's score.
-- Optional filters: game_id, and a [start, end) range on started_at.
SELECT gp.play_id, gp.game_id, g.name AS game_name, gp.started_at, gp.finished_at, s.score
FROM game_play gp
JOIN session se        ON se.session_id = gp.session_id
JOIN game g            ON g.game_id = gp.game_id
JOIN game_play_score s ON s.play_id = gp.play_id
WHERE se.player_id = %(player_id)s
  AND gp.finished_at IS NOT NULL
  AND (%(game_id)s IS NULL OR gp.game_id = %(game_id)s)
  AND (%(start)s IS NULL OR gp.started_at >= %(start)s)
  AND (%(end)s IS NULL OR gp.started_at < %(end)s)
ORDER BY gp.started_at, gp.play_id
