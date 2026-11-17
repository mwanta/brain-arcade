"""HTTP routes for the read-only game catalog."""

from flask import Blueprint, jsonify


def create_catalog_routes(catalog_handler):
    bp = Blueprint("catalog", __name__, url_prefix="/api")

    @bp.get("/domains")
    def list_domains():
        return jsonify([d.to_json() for d in catalog_handler.list_domains()])

    @bp.get("/setting-types")
    def list_setting_types():
        return jsonify([t.to_json() for t in catalog_handler.list_setting_types()])

    @bp.get("/games")
    def list_games():
        return jsonify([g.to_json() for g in catalog_handler.list_games()])

    @bp.get("/games/<int:game_id>")
    def get_game(game_id):
        return jsonify(catalog_handler.get_game(game_id).to_json())

    return bp
