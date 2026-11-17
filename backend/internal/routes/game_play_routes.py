"""HTTP routes for game plays and level attempts."""

from flask import Blueprint, jsonify, request

from internal.models.game_play import StartGamePlayRequest
from internal.models.level_attempt import CreateLevelAttemptRequest


def create_game_play_routes(game_play_handler):
    bp = Blueprint("game_plays", __name__, url_prefix="/api")

    @bp.post("/game-plays")
    def start_play():
        req = StartGamePlayRequest.from_json(request.get_json(silent=True))
        return jsonify(game_play_handler.start_play(req).to_json()), 201

    @bp.get("/game-plays/<int:play_id>")
    def get_play(play_id):
        return jsonify(game_play_handler.get_play(play_id).to_json())

    @bp.post("/game-plays/<int:play_id>/finish")
    def finish_play(play_id):
        return jsonify(game_play_handler.finish_play(play_id).to_json())

    @bp.get("/sessions/<int:session_id>/game-plays")
    def list_session_plays(session_id):
        return jsonify([p.to_json() for p in game_play_handler.list_session_plays(session_id)])

    @bp.post("/game-plays/<int:play_id>/attempts")
    def record_attempt(play_id):
        req = CreateLevelAttemptRequest.from_json(request.get_json(silent=True))
        return jsonify(game_play_handler.record_attempt(play_id, req).to_json()), 201

    @bp.get("/game-plays/<int:play_id>/attempts")
    def list_attempts(play_id):
        return jsonify([a.to_json() for a in game_play_handler.list_attempts(play_id)])

    return bp
