from datetime import date

import pytest

from internal.models.stats import StatsQuery
from internal.server import create_app


@pytest.fixture
def client(fake_repo):
    return create_app(repo=fake_repo).test_client()


def test_query_string_is_parsed(client, fake_repo):
    res = client.get("/api/players/1/stats/history?from=2026-11-01&to=2026-11-30&game_id=2")
    assert res.status_code == 200 and res.get_json() == []
    assert fake_repo.stats_store.last_call == (
        "score_history",
        1,
        StatsQuery(date(2026, 11, 1), date(2026, 11, 30), 2),
    )


@pytest.mark.parametrize("path", ["history", "summary", "comparison"])
def test_endpoints_exist_and_validate(client, path):
    assert client.get(f"/api/players/1/stats/{path}").status_code == 200
    assert client.get(f"/api/players/1/stats/{path}?from=bad").status_code == 400
    assert client.get(f"/api/players/99/stats/{path}").status_code == 404
