import pytest

from internal.errors import NotFoundError
from internal.handlers.catalog_handler import CatalogHandler


@pytest.fixture
def handler(fake_repo):
    return CatalogHandler(fake_repo)


def test_lists(handler):
    assert [d.name for d in handler.list_domains()] == ["attention", "memory"]
    assert [t.name for t in handler.list_setting_types()] == ["max_errors", "time_limit"]
    assert [g.name for g in handler.list_games()] == ["Odd One Out", "Sequence Recall"]


def test_get_game_attaches_settings_to_each_level(handler):
    detail = handler.get_game(1)
    assert [lvl.level_number for lvl in detail.levels] == [1, 2]
    assert set(detail.levels[0].settings) == {"time_limit", "max_errors"}
    assert set(detail.levels[1].settings) == {"time_limit"}


def test_level_without_settings_gets_empty_dict(handler):
    assert handler.get_game(2).levels[0].settings == {}


def test_missing_game(handler):
    with pytest.raises(NotFoundError):
        handler.get_game(99)
