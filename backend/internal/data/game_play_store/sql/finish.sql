-- No-op if the play has already finished.
UPDATE game_play
SET finished_at = NOW()
WHERE play_id = %(play_id)s AND finished_at IS NULL
