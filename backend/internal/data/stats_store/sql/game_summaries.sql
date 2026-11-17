-- Per-game totals for one player's finished plays (same filters as score_history).
SELECT gp.game_id,
       g.name            AS game_name,
       d.name            AS domain_name,
       COUNT(*)          AS plays,
       MAX(s.score)      AS best_score,
       AVG(s.score)      AS avg_score,
       MAX(gp.started_at) AS last_played_at
FROM game_play gp
JOIN session se          ON se.session_id = gp.session_id
JOIN game g              ON g.game_id = gp.game_id
JOIN cognitive_domain d  ON d.domain_id = g.domain_id
JOIN game_play_score s   ON s.play_id = gp.play_id
WHERE se.player_id = %(player_id)s
  AND gp.finished_at IS NOT NULL
  AND (%(game_id)s IS NULL OR gp.game_id = %(game_id)s)
  AND (%(start)s IS NULL OR gp.started_at >= %(start)s)
  AND (%(end)s IS NULL OR gp.started_at < %(end)s)
GROUP BY gp.game_id, g.name, d.name
ORDER BY g.name
