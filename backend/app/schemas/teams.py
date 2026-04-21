from app.schemas.common import OrmBase


class TeamOut(OrmBase):
    id: int
    name: str
    description: str | None = None
