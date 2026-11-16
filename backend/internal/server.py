"""App entry point: wires Database -> Repository (stores) -> handlers -> routes."""
from flask import Flask, jsonify

from internal.config import Config
from internal.data.database import Database
from internal.data.repository import Repository
from internal.errors import AppError
from internal.handlers.user_handler import UserHandler
from internal.routes.user_routes import create_user_routes


def create_app(config=None, repo=None):
    """`repo` can be injected (e.g. a Repository of fake stores in tests)."""
    config = config or Config()
    app = Flask(__name__)

    repo = repo or Repository.from_database(Database(config))
    register_routes(app, repo)

    @app.errorhandler(AppError)
    def handle_app_error(err):
        return jsonify({"error": err.message, "details": err.details}), err.status_code

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


def register_routes(app, repo):
    """Builds each handler from the repo and mounts its routes."""
    app.register_blueprint(create_user_routes(UserHandler(repo)))


if __name__ == "__main__":
    cfg = Config()
    create_app(cfg).run(port=cfg.api_port, debug=True)
