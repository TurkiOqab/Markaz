from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Proxy(Base, TimestampMixin):
    __tablename__ = "proxies"

    id: Mapped[int] = mapped_column(primary_key=True)
    delegator_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    substitute_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    shift_date: Mapped[date] = mapped_column(Date, nullable=False)
    coverage_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    settled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    settled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
