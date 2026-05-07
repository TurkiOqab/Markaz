from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.auth.routes import router as auth_router
from app.config import BACKEND_DIR
from app.routes.building import router as building_router
from app.routes.dashboard import router as dashboard_router
from app.routes.employees import router as employees_router
from app.routes.drills import router as drills_router
from app.routes.equipment import router as equipment_router
from app.routes.incidents import router as incidents_router
from app.routes.proxies import router as proxies_router
from app.routes.roll_calls import router as roll_calls_router
from app.routes.teams import router as teams_router
from app.routes.vehicles import router as vehicles_router

app = FastAPI(title="Markaz", version="0.1.0")
app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(employees_router)
app.include_router(vehicles_router)
app.include_router(building_router)
app.include_router(dashboard_router)
app.include_router(drills_router)
app.include_router(equipment_router)
app.include_router(incidents_router)
app.include_router(proxies_router)
app.include_router(roll_calls_router)

(BACKEND_DIR / "uploads").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=BACKEND_DIR / "uploads"), name="uploads")


@app.get("/api/health")
def health() -> dict:
    return {"data": {"status": "ok"}}
