import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "markaz.db"

DB_PATH = Path(os.environ.get("MARKAZ_DB_PATH", str(DEFAULT_DB_PATH)))

DB_URL_OVERRIDE = os.environ.get("MARKAZ_DB_URL")


def get_db_url() -> str:
    if DB_URL_OVERRIDE:
        return DB_URL_OVERRIDE
    return f"sqlite:///{DB_PATH}"


SESSION_COOKIE_NAME = "markaz_session"
SESSION_DAYS = 14

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_MINUTES = 15
