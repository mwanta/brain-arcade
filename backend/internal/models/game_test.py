from decimal import Decimal

from internal.models.game import Game, GameDetail, Level


def test_game_detail_to_json_nests_levels_and_formats_settings():
    game = Game(1, 1, "memory", "Sequence Recall", None)
    detail = GameDetail(game, [Level(1, 1, 1, {"time_limit": Decimal("10000.00"), "speed": Decimal("1.50")})])
    out = detail.to_json()
    assert out["name"] == "Sequence Recall" and out["domain_name"] == "memory"
    assert out["levels"] == [
        {"level_id": 1, "game_id": 1, "level_number": 1, "settings": {"time_limit": 10000, "speed": 1.5}}
    ]
