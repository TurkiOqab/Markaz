from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, Team
from app.schemas.common import ListResponse
from app.schemas.teams import TeamOut

router = APIRouter()


@router.get("/api/teams")
def list_teams(
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    rows = db.execute(select(Team).order_by(Team.id)).scalars().all()
    items = [TeamOut.model_validate(t) for t in rows]
    return {
        "data": ListResponse[TeamOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump()
    }
