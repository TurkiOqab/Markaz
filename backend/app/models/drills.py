from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Drill(Base, TimestampMixin):
    """Scheduled visit (زيارة) or drill (فرضية)."""

    __tablename__ = "drills"

    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # List of {label: str, completed: bool, completed_at: str|None}
    # Stored as JSON so the chief can customise stages per drill.
    prep_stages: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
