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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions and how to add a new table.

## API

Errors return `{error, details}` with 400 (validation), 404 (not found) or 409 (conflict, e.g. username taken or session already ended). Times are ISO 8601. Frontend wrappers for every endpoint are in `frontend/src/api/`.

**Players**

| Method | Path | Body / notes |
|---|---|---|
| GET | /api/players | |
| GET | /api/players/:id | |
| POST | /api/players | `{username, birthday, gender?}` |
| PATCH | /api/players/:id | any subset of `username, birthday, gender` |

`gender` is one of `female, male, non_binary, other, prefer_not_to_say`. `player_id`, `created_at` and `updated_at` are server-assigned.

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
| POST | /api/sessions | `{player_id}` |
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
