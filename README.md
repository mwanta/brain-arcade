# Brain Arcade

MySQL + Flask (Python) + React (Vite). Database design: [SCHEMA.md](SCHEMA.md).

```
scripts/       db_rebuild.sh, db_backup.sh
backend/database/  schema.sql, seed.sql, backups/ (mysqldump output)
backend/internal/
  server.py        app factory: wires Database -> Repository -> handlers -> routes
  models/          dataclasses that cross the API boundary (request parsing/validation, response JSON)
  routes/          HTTP only: JSON -> request model, call handler, model -> JSON
  handlers/        business rules (existence, uniqueness); receives the Repository in its constructor
  data/            SQL only; one <table>_store/ directory per table (store, fake, test, sql/*.sql queries),
                   stats_store/ for cross-table reporting queries,
                   + shared database.py, sql_loader.py, and repository.py (one field per store)
  conftest.py      shared test fixtures (fake_repo); data/conftest.py has DB test fixtures
  **/*_test.py     tests live next to the file they test
frontend/src/
  main.jsx         page routes
  api/             backend calls (client.js fetch wrapper + one file per resource)
  components/      one component per file
  pages/           compose components into pages
  games/drift/     Drift's game logic, tutorial and tests
```

## Setup

1. **Credentials:** `cp backend/.env.example backend/.env` and set `DB_PASSWORD` (and `DB_USER` if not root).
2. **Database:** `./scripts/db_rebuild.sh` drops and recreates `brain_arcade` from `schema.sql` + `seed.sql`.
   - Back up: `./scripts/db_backup.sh` writes `backend/database/backups/brain_arcade_<timestamp>.sql`
   - Restore a backup: `./scripts/db_rebuild.sh backend/database/backups/<file>.sql`
3. **Backend** (port 5001):
   ```
   cd backend
   python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
   .venv/bin/python -m internal.server
   .venv/bin/python -m pytest      # uses FakePlayerStore, no DB needed
   RUN_DB_TESTS=1 .venv/bin/python -m pytest   # also runs player_store_test.py against MySQL
   ```
4. **Frontend** (port 5173, proxies `/api` to the backend):
   ```
   cd frontend && npm install && npm run dev
   cd frontend && npm test         # unit tests (Jest)
   ```

5. **Formatting:** `make format` fixes formatting (ruff for Python, Prettier for the frontend). `make format-check` only reports, and CI runs it.

## Games

**Drift** (`frontend/src/games/drift/`, page in `frontend/src/pages/DriftGamePage.jsx`) is mounted at `/drift/*` and needs login.

- `/drift` is the how-to-play tutorial, with a Start Game button.
- `/drift/play` is the game: 10 levels of 5 rounds each, with 5 lives for the whole game. Other paths go back to `/drift`.
- Plays are saved: one backend session per sitting (it ends when the player leaves `/drift/play` or closes the page), one game play per game, and one level attempt per finished level. The database score is the last level fully passed.
- The round count and the lives come from the game, so Drift's levels in `seed.sql` have no `trial_count` or `max_errors` settings. `time_limit` is the time allowed per round.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions and how to add a new table.

## API

Errors return `{error, details}` with 400 (validation), 404 (not found) or 409 (conflict, e.g. username taken or session already ended). Times are ISO 8601. Frontend wrappers for every endpoint are in `frontend/src/api/`.

**Players**

| Method | Path | Body / notes |
|---|---|---|
| GET | /api/players | |
| GET | /api/players/:id | |
| POST | /api/players | `{username, birthday, gender?, occupation?, education_level?}` |
| PATCH | /api/players/:id | any subset of `username, birthday, gender, occupation, education_level` |
| POST | /api/login | `{username}`; returns the player, or 404 if no player has that username. There are no passwords: the frontend keeps the logged-in player in memory (a refresh logs out). |

`gender` is one of `female, male, non_binary, other, prefer_not_to_say`. `occupation` is one of `student, technology, healthcare, education, business, trades, arts_media, service, retired, unemployed, other`. `education_level` is one of (lowest to highest) `less_than_high_school, high_school, some_college, associate, bachelor, master, doctorate`. `player_id`, `created_at` and `updated_at` are server-assigned.

**Game catalog** (read-only; edit through `seed.sql`)

| Method | Path | Body / notes |
|---|---|---|
| GET | /api/domains | |
| GET | /api/setting-types | names and units, e.g. `time_limit` (ms), `max_errors` |
| GET | /api/games | |
| GET | /api/games/:id | includes `levels`, each with a `settings` map such as `{"time_limit": 5000, "max_errors": 0}` |

**Sessions and check-ins**

| Method | Path | Body / notes |
|---|---|---|
| POST | /api/sessions | `{player_id}`; also tidies the player's other open sessions that have been quiet for 2 hours: one with a check-in or a finished play is ended at its last activity, any other is deleted (see [SCHEMA.md](SCHEMA.md)) |
| GET | /api/sessions/:id | |
| POST | /api/sessions/:id/end | 409 if already ended |
| GET | /api/players/:id/sessions | newest first |
| POST | /api/sessions/:id/check-in | `{hours_slept?, caffeine_drinks?, stress_level? (1-5), exercised_today?}`; one per session |
| GET | /api/sessions/:id/check-in | |

**Game plays and level attempts**

| Method | Path | Body / notes |
|---|---|---|
| POST | /api/game-plays | `{session_id, game_id}`; session must not have ended |
| GET | /api/game-plays/:id | includes `score` (highest level passed) |
| POST | /api/game-plays/:id/finish | 409 if already finished |
| GET | /api/sessions/:id/game-plays | |
| POST | /api/game-plays/:id/attempts | `{level_id, passed, duration_ms?, error_count?, started_at?}`; level must belong to the play's game; play must not be finished. The game decides `passed` from the level's settings. |
| GET | /api/game-plays/:id/attempts | in attempt order |

**Stats** (only finished plays count). All take optional `?from=YYYY-MM-DD&to=YYYY-MM-DD&game_id=N`; `to` includes that whole day.

| Method | Path | Returns |
|---|---|---|
| GET | /api/players/:id/stats/history | each play's score over time |
| GET | /api/players/:id/stats/summary | per game: plays, best and average score, last played |
| GET | /api/players/:id/stats/comparison | per game: the player's average vs. their age decade (e.g. `30-39`), group size, and `percentile` (% of others in the group with a lower average) |

**Cohort stats** compare a player with a filtered group of other players (their *cohort*). They take the same `from`, `to` and `game_id` filters as above, plus any of these cohort filters, combined with AND. With no filters, the cohort is every player. The player is always part of their own cohort.

| Filter | Example | Meaning |
|---|---|---|
| `gender`, `occupation`, `education_level` | `occupation=student,retired` | include only these values (comma-separated) |
| `education_min`, `education_max` | `education_min=bachelor` | education range, inclusive |
| `age_min`, `age_max` | `age_min=20&age_max=35` | current age range, inclusive |
| `match` | `match=age_group,occupation` | same value as the player; `age_group` is the same decade |
| `min_plays` | `min_plays=3` | a member counts for a game only after this many plays of it (default 1) |

| Method | Path | Returns |
|---|---|---|
| GET | /api/players/:id/stats/cohort/comparison | per game: the player's plays, average and best vs. the cohort's size and average, plus the player's rank and `percentile` |
| GET | /api/players/:id/stats/cohort/distribution | per game and best score reached: how many members have that best score, the percentile range (`percentile_low` to `percentile_high`) it covers, and `is_player_best` |
| GET | /api/players/:id/stats/cohort/breakdown | per game: the cohort split by `group_by` (`age_group`, `gender`, `occupation` (default) or `education_level`), with each group's size, average and rank, and `is_player_group` |
| GET | /api/players/:id/stats/cohort/learning-curve | per game and play number (1 to `max_play_number`, default 10): the player's score vs. the peer average on their play with the same number |
| GET | /api/players/:id/stats/cohort/conditions | per check-in factor (`sleep`, `caffeine`, `stress`, `exercise`) and bucket: plays and average completion (share of the game's levels passed) for the player and for peers |
| GET | /api/players/:id/stats/cohort/levels | per level the player attempted: attempts, pass rate and average time on passed attempts vs. the cohort, the level's time limit and error allowance, and the player's pass-rate percentile |

Percentages are 0-100. "Peers" means the cohort minus the player. The filtering is done by the `load_cohort` stored procedure (see [SCHEMA.md](SCHEMA.md)).
