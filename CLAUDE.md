# Brain Arcade

Setup and layout are in @README.md. Project conventions and the step-by-step guide for adding a table are in @CONTRIBUTING.md; follow them exactly.

## Working in this repo

- **NEVER commit to or push to `main`.** Before making changes, check the current branch. If it is `main`, create a new branch (`<name>/<short-description>`) first. Push only that branch and open a PR into `main`. Never force-push, and never merge PRs yourself.
- When adding CRUD for a table, copy the structure of the `player` files at every layer rather than inventing a new pattern.
- Run backend tests with `cd backend && .venv/bin/python -m pytest`. They use fake stores and need no database.
- Verify the frontend with `cd frontend && npm run build`. Frontend unit tests (Jest) run with `cd frontend && npm test`.
- Run `make format` from the repo root after editing code; CI fails on `make format-check`.
- Never read, edit or print `backend/.env`; it holds the MySQL password.
- Ask before running `./scripts/db_rebuild.sh` or `RUN_DB_TESTS=1` tests. Rebuilding drops the whole database, and the integration tests write to it.
- Keep `schema.sql`, `SCHEMA.md` (diagram and notes), the model, the store's `sql/` files and the fake store consistent when a column changes.
