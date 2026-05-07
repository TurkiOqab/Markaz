from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import DrillKind, OrmBase


class PrepStage(BaseModel):
    label: str = Field(min_length=1, max_length=200)
    completed: bool = False
    completed_at: str | None = None


class DrillCreate(BaseModel):
    kind: DrillKind
    title: str = Field(min_length=1, max_length=300)
    scheduled_at: date
    notes: str | None = Field(default=None, max_length=2000)
    prep_stages: list[PrepStage] = Field(default_factory=list)


class DrillUpdate(BaseModel):
    kind: DrillKind | None = None
    title: str | None = Field(default=None, min_length=1, max_length=300)
    scheduled_at: date | None = None
    completed: bool | None = None
    notes: str | None = Field(default=None, max_length=2000)
    prep_stages: list[PrepStage] | None = None


class DrillOut(OrmBase):
    id: int
    kind: str
    title: str
    scheduled_at: date
    completed: bool
    completed_at: datetime | None = None
    notes: str | None = None
    prep_stages: list[PrepStage] = Field(default_factory=list)

    @field_validator("scheduled_at", mode="before")
    @classmethod
    def _coerce_to_date(cls, v):  # noqa: ANN001
        if isinstance(v, datetime):
            return v.date()
        return v
