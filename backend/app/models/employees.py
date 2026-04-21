from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Team(Base, TimestampMixin):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500))

    employees: Mapped[list["Employee"]] = relationship(back_populates="team")


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    rank: Mapped[str] = mapped_column(String(50), nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    marital_status: Mapped[str] = mapped_column(String(20), nullable=False)
    physical_ability: Mapped[str] = mapped_column(String(20), nullable=False)
    national_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    photo_path: Mapped[Optional[str]] = mapped_column(String(500))
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(200))
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False)
    shift: Mapped[str] = mapped_column(String(20), nullable=False)

    team: Mapped[Team] = relationship(back_populates="employees")
    certifications: Mapped[list["Certification"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan"
    )
    equipment: Mapped[list["Equipment"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan"
    )
    monthly_ratings: Mapped[list["MonthlyRating"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan"
    )


class Certification(Base, TimestampMixin):
    __tablename__ = "certifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    issuing_authority: Mapped[str] = mapped_column(String(200), nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)

    employee: Mapped[Employee] = relationship(back_populates="certifications")


class Equipment(Base, TimestampMixin):
    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100))
    assigned_date: Mapped[date] = mapped_column(Date, nullable=False)
    condition: Mapped[str] = mapped_column(String(20), nullable=False)

    employee: Mapped[Employee] = relationship(back_populates="equipment")


class MonthlyRating(Base, TimestampMixin):
    __tablename__ = "monthly_ratings"
    __table_args__ = (UniqueConstraint("employee_id", "year", "month"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    year: Mapped[int] = mapped_column(nullable=False)
    month: Mapped[int] = mapped_column(nullable=False)
    rating: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(500))

    employee: Mapped[Employee] = relationship(back_populates="monthly_ratings")
