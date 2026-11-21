"""App entry point: wires Database -> Repository (stores) -> handlers -> routes."""

from flask import Flask, jsonify

from internal.config import Config
from internal.data.database import Database
from internal.data.repository import Repository
from internal.errors import AppError
from internal.handlers.catalog_handler import CatalogHandler
from internal.handlers.game_play_handler import GamePlayHandler
from internal.handlers.player_handler import PlayerHandler
from internal.handlers.session_handler import SessionHandler
from internal.handlers.stats_handler import StatsHandler
from internal.routes.catalog_routes import create_catalog_routes
from internal.routes.game_play_routes import create_game_play_routes
from internal.routes.player_routes import create_login_routes, create_player_routes
from internal.routes.session_routes import create_session_routes
from internal.routes.stats_routes import create_stats_routes


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
    player_handler = PlayerHandler(repo)
    app.register_blueprint(create_player_routes(player_handler))
    app.register_blueprint(create_login_routes(player_handler))
    app.register_blueprint(create_catalog_routes(CatalogHandler(repo)))
    app.register_blueprint(create_session_routes(SessionHandler(repo)))
    app.register_blueprint(create_game_play_routes(GamePlayHandler(repo)))
    app.register_blueprint(create_stats_routes(StatsHandler(repo)))


if __name__ == "__main__":
    cfg = Config()
    create_app(cfg).run(port=cfg.api_port, debug=True)
