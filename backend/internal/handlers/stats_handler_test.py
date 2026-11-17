import pytest

from internal.errors import NotFoundError
from internal.handlers.stats_handler import StatsHandler
from internal.models.stats import StatsQuery


@pytest.fixture
def handler(fake_repo):
    return StatsHandler(fake_repo)


@pytest.mark.parametrize("method", ["score_history", "game_summaries", "age_group_comparison"])
def test_delegates_to_stats_store(handler, fake_repo, method):
    query = StatsQuery(game_id=1)
    assert getattr(handler, method)(1, query) == []
    assert fake_repo.stats_store.last_call == (method, 1, query)


@pytest.mark.parametrize("method", ["score_history", "game_summaries", "age_group_comparison"])
def test_missing_player(handler, method):
    with pytest.raises(NotFoundError):
        getattr(handler, method)(99, StatsQuery())
