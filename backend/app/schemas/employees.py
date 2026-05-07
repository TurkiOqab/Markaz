from datetime import date, datetime

from pydantic import BaseModel, Field, computed_field

from app.schemas.common import (
    EquipmentCondition,
    MaritalStatus,
    OrmBase,
    PhysicalAbility,
    Shift,
)

# ---------- Certifications ----------


class CertificationBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    issuing_authority: str = Field(min_length=1, max_length=200)
    issue_date: date
    expiry_date: date


class CertificationCreate(CertificationBase):
    pass


class CertificationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    issuing_authority: str | None = Field(default=None, min_length=1, max_length=200)
    issue_date: date | None = None
    expiry_date: date | None = None


class CertificationOut(OrmBase):
    id: int
    name: str
    issuing_authority: str
    issue_date: date
    expiry_date: date


# ---------- Equipment (assigned to employee) ----------


class EquipmentBase(BaseModel):
    item_name: str = Field(min_length=1, max_length=200)
    serial_number: str | None = Field(default=None, max_length=100)
    assigned_date: date
    condition: EquipmentCondition


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    item_name: str | None = Field(default=None, min_length=1, max_length=200)
    serial_number: str | None = Field(default=None, max_length=100)
    assigned_date: date | None = None
    condition: EquipmentCondition | None = None


class EquipmentOut(OrmBase):
    id: int
    item_name: str
    serial_number: str | None = None
    assigned_date: date
    condition: EquipmentCondition


# ---------- Monthly ratings ----------


class MonthlyRatingBase(BaseModel):
    year: int = Field(ge=2000, le=2100)
    month: int = Field(ge=1, le=12)
    specialty_score: int = Field(ge=0, le=25)
    discipline_score: int = Field(ge=0, le=25)
    fitness_score: int = Field(ge=0, le=25)
    appearance_score: int = Field(ge=0, le=25)
    notes: str | None = Field(default=None, max_length=500)


class MonthlyRatingCreate(MonthlyRatingBase):
    pass


class MonthlyRatingUpdate(BaseModel):
    specialty_score: int | None = Field(default=None, ge=0, le=25)
    discipline_score: int | None = Field(default=None, ge=0, le=25)
    fitness_score: int | None = Field(default=None, ge=0, le=25)
    appearance_score: int | None = Field(default=None, ge=0, le=25)
    notes: str | None = Field(default=None, max_length=500)


class MonthlyRatingOut(OrmBase):
    id: int
    year: int
    month: int
    specialty_score: int
    discipline_score: int
    fitness_score: int
    appearance_score: int
    notes: str | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def total(self) -> int:
        return (
            self.specialty_score
            + self.discipline_score
            + self.fitness_score
            + self.appearance_score
        )


# ---------- Employees ----------


class EmployeeBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    rank: str = Field(min_length=1, max_length=50)
    specialty: str = Field(min_length=1, max_length=100)
    date_of_birth: date
    marital_status: MaritalStatus
    physical_ability: PhysicalAbility
    national_id: str = Field(min_length=5, max_length=20)
    phone: str = Field(min_length=5, max_length=20)
    email: str | None = Field(default=None, max_length=200)
    team_id: int
    shift: Shift


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    rank: str | None = Field(default=None, min_length=1, max_length=50)
    specialty: str | None = Field(default=None, min_length=1, max_length=100)
    date_of_birth: date | None = None
    marital_status: MaritalStatus | None = None
    physical_ability: PhysicalAbility | None = None
    national_id: str | None = Field(default=None, min_length=5, max_length=20)
    phone: str | None = Field(default=None, min_length=5, max_length=20)
    email: str | None = Field(default=None, max_length=200)
    team_id: int | None = None
    shift: Shift | None = None


class EmployeeSummary(OrmBase):
    """Used in list views — no nested relations."""

    id: int
    name: str
    rank: str
    specialty: str
    national_id: str
    photo_path: str | None = None
    team_id: int
    shift: Shift
    # Average of monthly ratings, scaled to 0-100. None when no ratings exist.
    rating_score: int | None = None
    certifications_count: int = 0
    certification_names: list[str] = []
    proxy_balance: int = 0


class ManagerNoteCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    # Optional follow-up action recorded by the manager.
    action_taken: str | None = Field(default=None, max_length=2000)


class ManagerNoteOut(OrmBase):
    id: int
    text: str
    action_taken: str | None = None
    created_at: datetime
    author_chief_id: int | None = None


class EmployeeRead(OrmBase):
    """Full read including nested resources."""

    id: int
    name: str
    rank: str
    specialty: str
    date_of_birth: date
    marital_status: MaritalStatus
    physical_ability: PhysicalAbility
    national_id: str
    photo_path: str | None = None
    phone: str
    email: str | None = None
    team_id: int
    shift: Shift
    created_at: datetime
    updated_at: datetime
    certifications: list[CertificationOut] = []
    equipment: list[EquipmentOut] = []
    monthly_ratings: list[MonthlyRatingOut] = []
