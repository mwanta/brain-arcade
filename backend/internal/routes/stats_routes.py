"""HTTP routes for player score summaries.

All accept optional ?from=YYYY-MM-DD&to=YYYY-MM-DD&game_id=N.
"""

from flask import Blueprint, jsonify, request

from internal.models.stats import StatsQuery


def create_stats_routes(stats_handler):
    bp = Blueprint("stats", __name__, url_prefix="/api/players/<int:player_id>/stats")

    @bp.get("/history")
    def score_history(player_id):
        query = StatsQuery.from_args(request.args.to_dict())
        return jsonify([e.to_json() for e in stats_handler.score_history(player_id, query)])

    @bp.get("/summary")
    def game_summaries(player_id):
        query = StatsQuery.from_args(request.args.to_dict())
        return jsonify([s.to_json() for s in stats_handler.game_summaries(player_id, query)])

    @bp.get("/comparison")
    def age_group_comparison(player_id):
        query = StatsQuery.from_args(request.args.to_dict())
        return jsonify([c.to_json() for c in stats_handler.age_group_comparison(player_id, query)])

    return bp
