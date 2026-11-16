"""HTTP routes for /api/users: JSON <-> models, then delegate to UserHandler."""
from flask import Blueprint, jsonify, request

from internal.models.user import CreateUserRequest, UpdateUserRequest


def create_user_routes(user_handler):
    bp = Blueprint("users", __name__, url_prefix="/api/users")

    @bp.get("")
    def list_users():
        return jsonify([u.to_json() for u in user_handler.list_users()])

    @bp.get("/<int:user_id>")
    def get_user(user_id):
        return jsonify(user_handler.get_user(user_id).to_json())

    @bp.post("")
    def create_user():
        req = CreateUserRequest.from_json(request.get_json(silent=True))
        return jsonify(user_handler.create_user(req).to_json()), 201

    @bp.patch("/<int:user_id>")
    def update_user(user_id):
        req = UpdateUserRequest.from_json(request.get_json(silent=True))
        return jsonify(user_handler.update_user(user_id, req).to_json())

    return bp
