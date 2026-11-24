-- Deletes an open session that never produced anything worth keeping: no check-in and no
-- finished play. Its unfinished plays and their attempts go with it (ON DELETE CASCADE).
-- The checks are repeated here so a play finishing at the same moment is never deleted.
DELETE FROM session
WHERE session_id = %(session_id)s
  AND ended_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM check_in ci WHERE ci.session_id = session.session_id)
  AND NOT EXISTS (
      SELECT 1 FROM game_play gp
      WHERE gp.session_id = session.session_id AND gp.finished_at IS NOT NULL
  )
