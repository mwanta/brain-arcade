import pytest

from internal.data.sql_loader import load_queries


def test_loads_each_file_by_stem(tmp_path):
    (tmp_path / "get_thing.sql").write_text("SELECT 1\n")
    assert load_queries(tmp_path) == {"get_thing": "SELECT 1"}


def test_empty_directory_fails_fast(tmp_path):
    with pytest.raises(FileNotFoundError):
        load_queries(tmp_path)
