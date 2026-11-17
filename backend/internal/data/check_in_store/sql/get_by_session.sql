SELECT check_in_id, session_id, hours_slept, caffeine_drinks, stress_level, exercised_today
FROM check_in
WHERE session_id = %(session_id)s
