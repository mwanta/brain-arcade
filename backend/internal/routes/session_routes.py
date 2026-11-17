"""HTTP routes for sessions and check-ins."""

from flask import Blueprint, jsonify, request

from internal.models.check_in import CreateCheckInRequest
from internal.models.session import StartSessionRequest


def create_session_routes(session_handler):
    bp = Blueprint("sessions", __name__, url_prefix="/api")

    @bp.post("/sessions")
    def start_session():
        req = StartSessionRequest.from_json(request.get_json(silent=True))
        return jsonify(session_handler.start_session(req).to_json()), 201

    @bp.get("/sessions/<int:session_id>")
    def get_session(session_id):
        return jsonify(session_handler.get_session(session_id).to_json())

    @bp.post("/sessions/<int:session_id>/end")
    def end_session(session_id):
        return jsonify(session_handler.end_session(session_id).to_json())

    @bp.get("/players/<int:player_id>/sessions")
    def list_player_sessions(player_id):
        return jsonify([s.to_json() for s in session_handler.list_player_sessions(player_id)])

    @bp.post("/sessions/<int:session_id>/check-in")
    def create_check_in(session_id):
        req = CreateCheckInRequest.from_json(request.get_json(silent=True))
        return jsonify(session_handler.create_check_in(session_id, req).to_json()), 201

    @bp.get("/sessions/<int:session_id>/check-in")
    def get_check_in(session_id):
        return jsonify(session_handler.get_check_in(session_id).to_json())

    return bp
