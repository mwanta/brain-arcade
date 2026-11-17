SELECT gp.play_id, gp.session_id, gp.game_id, gp.started_at, gp.finished_at, s.score
FROM game_play gp
JOIN game_play_score s ON s.play_id = gp.play_id
WHERE gp.session_id = %(session_id)s
ORDER BY gp.started_at, gp.play_id
