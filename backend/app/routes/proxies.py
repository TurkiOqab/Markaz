from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, Employee, Proxy, Team
from app.schemas.proxies import BalanceOut, ProxyCreate, ProxyOut, ProxyUpdate

router = APIRouter(prefix="/api/proxies", tags=["proxies"])


def _serialize(proxy: Proxy, employees: dict[int, Employee], teams: dict[int, Team]) -> dict:
    deleg = employees.get(proxy.delegator_id)
    sub = employees.get(proxy.substitute_id)
    return {
        "id": proxy.id,
        "delegator_id": proxy.delegator_id,
        "substitute_id": proxy.substitute_id,
        "delegator_name": deleg.name if deleg else "—",
        "substitute_name": sub.name if sub else "—",
        "delegator_team": teams[deleg.team_id].name
        if deleg and deleg.team_id in teams
        else None,
        "substitute_team": teams[sub.team_id].name if sub and sub.team_id in teams else None,
        "shift_date": proxy.shift_date.isoformat(),
        "coverage_date": proxy.coverage_date.isoformat() if proxy.coverage_date else proxy.shift_date.isoformat(),
        "reason": proxy.reason,
        "settled": proxy.settled,
        "settled_date": proxy.settled_date.isoformat() if proxy.settled_date else None,
        "created_at": proxy.created_at.date().isoformat() if proxy.created_at else None,
    }


def _load_dirs(db: Session) -> tuple[dict[int, Employee], dict[int, Team]]:
    employees = {e.id: e for e in db.execute(select(Employee)).scalars().all()}
    teams = {t.id: t for t in db.execute(select(Team)).scalars().all()}
    return employees, teams


@router.get("")
def list_proxies(
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    rows = (
        db.execute(select(Proxy).order_by(Proxy.created_at.desc(), Proxy.id.desc()))
        .scalars()
        .all()
    )
    employees, teams = _load_dirs(db)
    items = [_serialize(p, employees, teams) for p in rows]
    return {"data": {"items": items, "total": len(items)}}


@router.get("/balances")
def list_balances(
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    pending = db.execute(select(Proxy).where(Proxy.settled.is_(False))).scalars().all()
    counts: dict[int, int] = defaultdict(int)
    for p in pending:
        counts[p.substitute_id] += 1

    employees, teams = _load_dirs(db)
    items: list[dict] = []
    for sub_id, count in counts.items():
        emp = employees.get(sub_id)
        if emp is None:
            continue
        items.append(
            BalanceOut(
                substitute_id=sub_id,
                substitute_name=emp.name,
                team_name=teams[emp.team_id].name if emp.team_id in teams else None,
                count=count,
            ).model_dump()
        )
    items.sort(key=lambda x: -x["count"])
    return {
        "data": {
            "items": items,
            "total_pending": sum(counts.values()),
            "unique_substitutes": len(counts),
        }
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_proxy(
    payload: ProxyCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    deleg = db.get(Employee, payload.delegator_id)
    sub = db.get(Employee, payload.substitute_id)
    if deleg is None or sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    proxy = Proxy(
        delegator_id=payload.delegator_id,
        substitute_id=payload.substitute_id,
        shift_date=payload.shift_date,
        coverage_date=payload.coverage_date or payload.shift_date,
        reason=payload.reason,
        settled=False,
    )
    db.add(proxy)
    db.commit()
    db.refresh(proxy)
    employees, teams = _load_dirs(db)
    return {"data": _serialize(proxy, employees, teams)}


@router.patch("/{proxy_id}")
def update_proxy(
    proxy_id: int,
    payload: ProxyUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    proxy = db.get(Proxy, proxy_id)
    if proxy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الوكالة غير موجودة")
    data = payload.model_dump(exclude_unset=True)
    new_deleg = data.get("delegator_id", proxy.delegator_id)
    new_sub = data.get("substitute_id", proxy.substitute_id)
    if new_deleg == new_sub:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="لا يمكن للموظف توكيل نفسه")
    if "delegator_id" in data and db.get(Employee, data["delegator_id"]) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    if "substitute_id" in data and db.get(Employee, data["substitute_id"]) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    for field, value in data.items():
        setattr(proxy, field, value)
    db.commit()
    db.refresh(proxy)
    employees, teams = _load_dirs(db)
    return {"data": _serialize(proxy, employees, teams)}


@router.patch("/{proxy_id}/settle")
def settle_proxy(
    proxy_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    proxy = db.get(Proxy, proxy_id)
    if proxy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الوكالة غير موجودة")
    if proxy.settled:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="الوكالة مُسوَّاة سابقاً")
    proxy.settled = True
    proxy.settled_date = date.today()
    db.commit()
    db.refresh(proxy)
    employees, teams = _load_dirs(db)
    return {"data": _serialize(proxy, employees, teams)}


@router.delete("/{proxy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proxy(
    proxy_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
):
    proxy = db.get(Proxy, proxy_id)
    if proxy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الوكالة غير موجودة")
    db.delete(proxy)
    db.commit()
