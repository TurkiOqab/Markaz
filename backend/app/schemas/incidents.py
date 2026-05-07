import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_serializer, field_validator

from app.schemas.common import IncidentSeverity, OrmBase


# Free-form details — frontend manages the structure of the long form.
DetailsDict = dict[str, Any]


class IncidentBase(BaseModel):
    occurred_at: datetime
    type: str = Field(min_length=1, max_length=30)
    severity: IncidentSeverity = "متوسط"
    location: str = Field(min_length=1, max_length=300)
    description: str = Field(min_length=1, max_length=5000)
    response_minutes: int | None = Field(default=None, ge=0, le=10000)
    duration_minutes: int | None = Field(default=None, ge=0, le=100000)
    personnel_count: int | None = Field(default=None, ge=0, le=1000)
    vehicles_dispatched: str | None = Field(default=None, max_length=500)
    outcome: str | None = Field(default=None, max_length=300)
    reporter_name: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=5000)
    status: str = Field(default="غير مكتمل", max_length=20)
    details: DetailsDict | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    occurred_at: datetime | None = None
    type: str | None = Field(default=None, min_length=1, max_length=30)
    severity: IncidentSeverity | None = None
    location: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
    response_minutes: int | None = Field(default=None, ge=0, le=10000)
    duration_minutes: int | None = Field(default=None, ge=0, le=100000)
    personnel_count: int | None = Field(default=None, ge=0, le=1000)
    vehicles_dispatched: str | None = Field(default=None, max_length=500)
    outcome: str | None = Field(default=None, max_length=300)
    reporter_name: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=5000)
    status: str | None = Field(default=None, max_length=20)
    details: DetailsDict | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class IncidentOut(OrmBase):
    id: int
    occurred_at: datetime
    type: str
    severity: str
    location: str
    description: str
    response_minutes: int | None = None
    duration_minutes: int | None = None
    personnel_count: int | None = None
    vehicles_dispatched: str | None = None
    outcome: str | None = None
    reporter_name: str | None = None
    notes: str | None = None
    status: str = "غير مكتمل"
    details: DetailsDict | None = None
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("details", mode="before")
    @classmethod
    def _parse_details(cls, v):  # noqa: ANN001
        # ORM stores details as a JSON-encoded string; decode on read.
        if isinstance(v, str):
            if not v:
                return None
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return None
        return v

    @field_serializer("details")
    def _ser_details(self, v: DetailsDict | None) -> DetailsDict | None:
        return v
