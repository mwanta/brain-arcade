"""Loads a store's .sql files into a {name: query} dict, once at import time."""
from pathlib import Path


def load_queries(sql_dir):
    """`sql_dir/get_by_id.sql` becomes queries["get_by_id"]."""
    queries = {p.stem: p.read_text().strip() for p in Path(sql_dir).glob("*.sql")}
    if not queries:
        raise FileNotFoundError(f"No .sql files found in {sql_dir}")
    return queries
