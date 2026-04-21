"""Test configuration: force a fresh SQLite URL BEFORE any app module is imported.

pytest loads conftest.py before test modules, so setting the env var here
means `app.db` will see the test URL on first import.
"""

import os
import tempfile
from pathlib import Path

import pytest

# Module-level setup runs before any test imports `app.*`.
_TEST_DIR = Path(tempfile.mkdtemp(prefix="markaz-test-"))
_TEST_DB_FILE = _TEST_DIR / "markaz-test.db"
os.environ["MARKAZ_DB_URL"] = f"sqlite:///{_TEST_DB_FILE}"


@pytest.fixture(autouse=True)
def fresh_db():
    """Before each test, drop and recreate all tables for isolation."""
    from app import models
    from app.db import engine

    models.Base.metadata.drop_all(engine)
    models.Base.metadata.create_all(engine)
    yield
