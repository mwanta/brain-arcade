# Brain Arcade

MySQL + Flask (Python) + React (Vite).

```
scripts/       db_rebuild.sh, db_backup.sh
backend/database/  schema.sql, seed.sql, backups/ (mysqldump output)
backend/internal/
  server.py        app factory: wires Database -> Repository -> handlers -> routes
  models/          dataclasses that cross the API boundary (request parsing/validation, response JSON)
  routes/          HTTP only: JSON -> request model, call handler, model -> JSON
  handlers/        business rules (existence, uniqueness); receives the Repository in its constructor
  data/            SQL only; one <table>_store/ directory per table (store, fake, test, sql/*.sql queries)
                   + shared database.py, sql_loader.py, and repository.py (one field per store)
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
   .venv/bin/python -m pytest      # uses FakeUserStore, no DB needed
   RUN_DB_TESTS=1 .venv/bin/python -m pytest   # also runs user_store_test.py against MySQL
   ```
4. **Frontend** (port 5173, proxies `/api` to the backend):
   ```
   cd frontend && npm install && npm run dev
   ```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions and how to add a new table.

## Users API

| Method | Path                  | Body                                   |
|--------|-----------------------|----------------------------------------|
| GET    | /api/users            |                                        |
| GET    | /api/users/:id        |                                        |
| POST   | /api/users            | `{username, birthday, gender?}`       |
| PATCH  | /api/users/:id        | any subset of `username, birthday, gender` |

Errors return `{error, details}` with 400 (validation), 404 (not found) or 409 (username taken).
`gender` is one of `female, male, non_binary, other, prefer_not_to_say`. `user_id`, `created_at` and `updated_at` are server-assigned.
