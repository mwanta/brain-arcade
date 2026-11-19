# Contributing

## Git workflow

**Never push to `main`.** Every change goes through a pull request.

1. Start from the latest main: `git checkout main && git pull`.
2. Create a branch for your work: `git switch -c <short-description>` (e.g. `sam/games-crud`).
3. Commit on that branch and push it: `git push origin <branch>`.
4. Open a PR into `main` and verify no merge conflicts before merging. No approval is needed, but GitHub blocks the merge until all CI checks pass.

## Conventions

- **One table = one store.** Each table gets `backend/internal/data/<table>_store/` with its own `sql/` folder.
- **Cross-table reporting queries get their own store** (e.g. `stats_store/`) instead of living in a table store.
- **No SQL in Python.** Queries live in `sql/*.sql` with `%(name)s` placeholders, loaded by `load_queries`.
- **Only models cross the API boundary.** Routes convert JSON to and from models. Handlers and stores never see raw request dicts.
- **Handlers take the `Repository`,** not a single store, and contain no HTTP or SQL.
- **Every store has a fake** (`fake_<table>_store.py`) so handler and route tests run without MySQL.
- **Tests sit beside the file they test** as `<file>_test.py`.
- **Schema changes go in `backend/database/schema.sql`** (and `seed.sql`), then rebuild with `./scripts/db_rebuild.sh`. Don't change tables by hand.
- **Use `player` as the template.** Every step below has a working `player` equivalent.

## Adding a new table

The example uses a hypothetical `badge` table.

1. **Schema:** add the `CREATE TABLE` to `backend/database/schema.sql` and sample rows to `seed.sql`, then run `./scripts/db_rebuild.sh`. Update the diagram and notes in `SCHEMA.md`.
2. **Model** (`internal/models/badge.py`):
   - a response dataclass `Badge` with `to_json()`;
   - request dataclasses `CreateBadgeRequest` and `UpdateBadgeRequest` with `from_json()`.

   Field format validation lives here; use `parse_fields` and the parsers in `models/fields.py` (`int_field`, `datetime_field`, ...). Format output with `iso()` and `number()`.
3. **Store** (`internal/data/badge_store/`):
   - `sql/*.sql`: one query per file.
   - `badge_store.py`: `BadgeStore(database)`; loads `sql/` with `load_queries`, runs queries, maps rows to models.
   - `fake_badge_store.py`: an in-memory version with the same methods.
   - `__init__.py`: export `BadgeStore`.
   - `badge_store_test.py`: integration tests against MySQL, skipped unless `RUN_DB_TESTS=1`.
4. **Register the store** in `internal/data/repository.py`: add a `badge_store: Optional[BadgeStore] = None` field and build it in `from_database`. (`repository_test.py` fails if you forget the second part.)
5. **Handler** (`internal/handlers/badge_handler.py`): `BadgeHandler(repo)` uses `repo.badge_store` and any other stores it needs. Business rules go here: not found, conflicts, cross-table checks. It takes and returns models.
6. **Routes** (`internal/routes/badge_routes.py`): `create_badge_routes(handler)` returns a Blueprint. Parse JSON into a request model, call the handler, return `model.to_json()`. Errors are raised as `AppError` subclasses from `internal/errors.py`; the server turns them into JSON responses.
7. **Register the routes** in `register_routes` in `internal/server.py`:
   `app.register_blueprint(create_badge_routes(BadgeHandler(repo)))`
8. **Tests:** add a `*_test.py` beside each new file. Handler and route tests use the `fake_repo` fixture in `internal/conftest.py`; add your fake store there. Store tests use the `db` and `make_player` fixtures in `internal/data/conftest.py`.
9. **Frontend:**
   - `src/api/badgesApi.js`: one function per endpoint, using `request()` from `client.js`.
   - `src/components/`: one component per file.
   - `src/pages/`: pages that put the components together.
   - `src/main.jsx`: add a `<Route>` for each page.

## Before opening a PR

Run `make format` from the repo root first. It formats Python with ruff and the frontend with Prettier, and fixes import order.

CI (`.github/workflows/ci.yml`) runs on every PR: `make format-check`, backend unit tests, backend database tests against a fresh MySQL 8 loaded from `schema.sql` + `seed.sql`, the frontend build, and frontend unit tests. All five must pass. To check locally first:

- `cd backend && .venv/bin/python -m pytest` passes.
- `cd frontend && npm run build` succeeds.
- `cd frontend && npm test` passes.
- The API table in `README.md` lists any new endpoints.
