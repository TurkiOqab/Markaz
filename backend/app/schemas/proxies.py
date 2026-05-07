from datetime import date

from pydantic import BaseModel, Field, model_validator

from app.schemas.common import OrmBase


class ProxyCreate(BaseModel):
    delegator_id: int
    substitute_id: int
    shift_date: date
    coverage_date: date | None = None
    reason: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def _no_self_delegation(self) -> "ProxyCreate":
        if self.delegator_id == self.substitute_id:
            raise ValueError("لا يمكن للموظف توكيل نفسه")
        return self


class ProxyUpdate(BaseModel):
    delegator_id: int | None = None
    substitute_id: int | None = None
    shift_date: date | None = None
    coverage_date: date | None = None
    reason: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def _no_self_delegation(self) -> "ProxyUpdate":
        if (
            self.delegator_id is not None
            and self.substitute_id is not None
            and self.delegator_id == self.substitute_id
        ):
            raise ValueError("لا يمكن للموظف توكيل نفسه")
        return self


class ProxyOut(OrmBase):
    id: int
    delegator_id: int
    substitute_id: int
    delegator_name: str
    substitute_name: str
    delegator_team: str | None = None
    substitute_team: str | None = None
    shift_date: date
    coverage_date: date | None = None
    reason: str | None = None
    settled: bool
    settled_date: date | None = None
    created_at: date | None = None


class BalanceOut(BaseModel):
    substitute_id: int
    substitute_name: str
    team_name: str | None = None
    count: int
