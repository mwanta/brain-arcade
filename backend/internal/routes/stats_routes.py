"""HTTP routes for player score summaries.

All accept optional ?from=YYYY-MM-DD&to=YYYY-MM-DD&game_id=N. The /cohort/* routes also
accept the cohort filters documented on CohortQuery (gender, occupation, match, ...).
"""

from flask import Blueprint, jsonify, request

from internal.models.stats import CohortQuery, StatsQuery


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

    # ---- cohort queries: date/game filters plus CohortQuery filters ----

    @bp.get("/cohort/comparison")
    def cohort_comparison(player_id):
        query, cohort = _cohort_args()
        return jsonify([r.to_json() for r in stats_handler.cohort_comparison(player_id, query, cohort)])

    @bp.get("/cohort/distribution")
    def cohort_distribution(player_id):
        query, cohort = _cohort_args()
        return jsonify([r.to_json() for r in stats_handler.cohort_distribution(player_id, query, cohort)])

    @bp.get("/cohort/breakdown")
    def demographic_breakdown(player_id):
        query, cohort = _cohort_args()
        return jsonify([r.to_json() for r in stats_handler.demographic_breakdown(player_id, query, cohort)])

    @bp.get("/cohort/learning-curve")
    def learning_curve(player_id):
        query, cohort = _cohort_args()
        return jsonify([r.to_json() for r in stats_handler.learning_curve(player_id, query, cohort)])

    @bp.get("/cohort/conditions")
    def condition_impact(player_id):
        query, cohort = _cohort_args()
        return jsonify([r.to_json() for r in stats_handler.condition_impact(player_id, query, cohort)])

    @bp.get("/cohort/levels")
    def level_performance(player_id):
        query, cohort = _cohort_args()
        return jsonify([r.to_json() for r in stats_handler.level_performance(player_id, query, cohort)])

    return bp


def _cohort_args():
    args = request.args.to_dict()
    return StatsQuery.from_args(args), CohortQuery.from_args(args)
