# Formatting and linting for the whole repo. Run from the repo root.
#   make format        rewrite files: ruff (Python) + Prettier (frontend)
#   make format-check  check only, change nothing (what CI runs)

# Use the backend venv when it exists (local dev), otherwise the system Python (CI).
VENV_PY := backend/.venv/bin/python
PY ?= $(if $(wildcard $(VENV_PY)),$(abspath $(VENV_PY)),python3)

.PHONY: help format format-check format-backend format-frontend check-backend check-frontend

help:
	@echo "make format        fix formatting, import order and auto-fixable lint (backend + frontend)"
	@echo "make format-check  report problems without changing files (used by CI)"

format: format-backend format-frontend

format-check: check-backend check-frontend

format-backend:
	cd backend && "$(PY)" -m ruff format . && "$(PY)" -m ruff check --fix .

check-backend:
	cd backend && "$(PY)" -m ruff check . && "$(PY)" -m ruff format --check .

format-frontend:
	cd frontend && npx prettier --write src

check-frontend:
	cd frontend && npx prettier --check src
