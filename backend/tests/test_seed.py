from app.db import SessionLocal
from app.models import Building, Employee, Room, Team, Vehicle
from scripts.seed import seed


def test_seed_loads_all_entities():
    with SessionLocal() as session:
        seed(session)

    with SessionLocal() as session:
        assert session.query(Team).count() == 3
        assert session.query(Employee).count() == 20
        assert session.query(Vehicle).count() == 8
        assert session.query(Building).count() == 1
        assert session.query(Room).count() == 15
