from datetime import date

from pydantic import BaseModel, Field, computed_field

from app.schemas.common import OrmBase


class RollCallUpsert(BaseModel):
    team: str = Field(min_length=1, max_length=20)
    total_force: int = Field(ge=0, le=10000)
    firefighters: int = Field(ge=0, le=10000)
    drivers: int = Field(ge=0, le=10000)
    divers: int = Field(ge=0, le=10000)
    trainers: int = Field(ge=0, le=10000)
    on_mission: int = Field(ge=0, le=10000)
    absent: int = Field(ge=0, le=10000)
    suspended: int = Field(ge=0, le=10000)
    catering: int = Field(ge=0, le=10000)


class RollCallOut(OrmBase):
    id: int
    date: date
    team: str
    total_force: int
    firefighters: int
    drivers: int
    divers: int
    trainers: int
    on_mission: int
    absent: int
    suspended: int
    catering: int

    @computed_field  # type: ignore[prop-decorator]
    @property
    def present_count(self) -> int:
        return self.firefighters + self.drivers + self.divers + self.trainers
