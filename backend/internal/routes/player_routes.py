"""HTTP routes for /api/players: JSON <-> models, then delegate to PlayerHandler."""

from flask import Blueprint, jsonify, request

from internal.models.player import CreatePlayerRequest, LoginRequest, UpdatePlayerRequest


def create_player_routes(player_handler):
    bp = Blueprint("players", __name__, url_prefix="/api/players")

    @bp.get("")
    def list_players():
        return jsonify([u.to_json() for u in player_handler.list_players()])

    @bp.get("/<int:player_id>")
    def get_player(player_id):
        return jsonify(player_handler.get_player(player_id).to_json())

    @bp.post("")
    def create_player():
        req = CreatePlayerRequest.from_json(request.get_json(silent=True))
        return jsonify(player_handler.create_player(req).to_json()), 201

    @bp.patch("/<int:player_id>")
    def update_player(player_id):
        req = UpdatePlayerRequest.from_json(request.get_json(silent=True))
        return jsonify(player_handler.update_player(player_id, req).to_json())

    return bp


def create_login_routes(player_handler):
    """POST /api/login {username} -> the player. Username only; there is no auth."""
    bp = Blueprint("login", __name__, url_prefix="/api/login")

    @bp.post("")
    def login():
        req = LoginRequest.from_json(request.get_json(silent=True))
        return jsonify(player_handler.login(req).to_json())

    return bp
