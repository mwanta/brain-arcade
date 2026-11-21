-- Fills the cohort_member, cohort_play and cohort_player_game temporary tables
-- (see the load_cohort procedure in schema.sql). The cohort_*.sql queries below
-- read them, so StatsStore runs this first, on the same connection.
CALL load_cohort(
    %(player_id)s,
    %(game_id)s, %(start)s, %(end)s,
    %(gender)s, %(occupation)s, %(education_level)s,
    %(education_min)s, %(education_max)s,
    %(age_min)s, %(age_max)s,
    %(match)s, %(min_plays)s
)
