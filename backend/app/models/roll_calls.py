from datetime import date

from sqlalchemy import Date, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class RollCall(Base, TimestampMixin):
    """Daily personnel status report (التكميل اليومي)."""

    __tablename__ = "roll_calls"

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date] = mapped_column(Date, unique=True, nullable=False, index=True)
    team: Mapped[str] = mapped_column("shift", String(20), nullable=False)

    total_force: Mapped[int] = mapped_column(nullable=False, default=0)
    firefighters: Mapped[int] = mapped_column(nullable=False, default=0)
    drivers: Mapped[int] = mapped_column(nullable=False, default=0)
    divers: Mapped[int] = mapped_column(nullable=False, default=0)
    trainers: Mapped[int] = mapped_column(nullable=False, default=0)
    on_mission: Mapped[int] = mapped_column(nullable=False, default=0)
    absent: Mapped[int] = mapped_column(nullable=False, default=0)
    suspended: Mapped[int] = mapped_column(nullable=False, default=0)
    catering: Mapped[int] = mapped_column(nullable=False, default=0)
