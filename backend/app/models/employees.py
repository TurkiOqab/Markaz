from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Team(Base, TimestampMixin):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))

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
    photo_path: Mapped[str | None] = mapped_column(String(500))
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(200))
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
    manager_notes: Mapped[list["ManagerNote"]] = relationship(
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
    serial_number: Mapped[str | None] = mapped_column(String(100))
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
    # Four axes (0-25 each); total = sum of the four (0-100).
    specialty_score: Mapped[int] = mapped_column(Integer, nullable=False)
    discipline_score: Mapped[int] = mapped_column(Integer, nullable=False)
    fitness_score: Mapped[int] = mapped_column(Integer, nullable=False)
    appearance_score: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500))

    employee: Mapped[Employee] = relationship(back_populates="monthly_ratings")

    @property
    def total(self) -> int:
        return (
            self.specialty_score
            + self.discipline_score
            + self.fitness_score
            + self.appearance_score
        )


class ManagerNote(Base, TimestampMixin):
    __tablename__ = "manager_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    author_chief_id: Mapped[int | None] = mapped_column(ForeignKey("chiefs.id"))
    text: Mapped[str] = mapped_column(String(2000), nullable=False)
    action_taken: Mapped[str | None] = mapped_column(String(2000))

    employee: Mapped[Employee] = relationship(back_populates="manager_notes")
