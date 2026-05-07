from datetime import date, datetime

from sqlalchemy import DateTime, Date, Float, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.employees import Employee


class Vehicle(Base, TimestampMixin):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    plate_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    # Deployment line: "الأول" (primary) or "الثاني" (secondary/backup).
    line: Mapped[str] = mapped_column(String(20), nullable=False, default="الأول")
    # Position in the yard layout (0–1 normalised within the line's canvas).
    # NULL until the chief drags the vehicle to its parking spot.
    yard_x: Mapped[float | None] = mapped_column(Float)
    yard_y: Mapped[float | None] = mapped_column(Float)
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"))
    photo_path: Mapped[str | None] = mapped_column(String(500))

    driver: Mapped[Employee | None] = relationship()
    maintenance: Mapped[list["VehicleMaintenance"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )
    equipment: Mapped[list["VehicleEquipment"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )
    inspections: Mapped[list["VehicleInspection"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )
    trips: Mapped[list["VehicleTrip"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )


class VehicleTrip(Base, TimestampMixin):
    """A movement order: odometer at departure and (when closed) at return."""

    __tablename__ = "vehicle_trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    start_odometer: Mapped[int] = mapped_column(Integer, nullable=False)
    end_at: Mapped[datetime | None] = mapped_column(DateTime)
    end_odometer: Mapped[int | None] = mapped_column(Integer)
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"))
    notes: Mapped[str | None] = mapped_column(String(500))

    vehicle: Mapped[Vehicle] = relationship(back_populates="trips")
    driver: Mapped[Employee | None] = relationship()


class VehicleMaintenance(Base, TimestampMixin):
    __tablename__ = "vehicle_maintenance"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    contractor: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)

    vehicle: Mapped[Vehicle] = relationship(back_populates="maintenance")


class VehicleEquipment(Base, TimestampMixin):
    __tablename__ = "vehicle_equipment"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    condition: Mapped[str] = mapped_column(String(20), nullable=False)

    vehicle: Mapped[Vehicle] = relationship(back_populates="equipment")


class VehicleInspection(Base, TimestampMixin):
    __tablename__ = "vehicle_inspections"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    inspection_date: Mapped[date] = mapped_column(Date, nullable=False)
    inspector_name: Mapped[str] = mapped_column(String(200), nullable=False)
    result: Mapped[str] = mapped_column(String(30), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(1000))

    vehicle: Mapped[Vehicle] = relationship(back_populates="inspections")
