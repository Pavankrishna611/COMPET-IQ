"""Database Session, Engine, and Base Package."""

from app.database.base import Base
from app.database.session import SessionLocal, engine, get_db


def __getattr__(name: str):
    if name == "init_db":
        from app.database.init_db import init_db

        return init_db
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


__all__ = [
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "init_db",
]
