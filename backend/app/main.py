from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.auth.routes import router as auth_router
from app.config import BACKEND_DIR
from app.routes.employees import router as employees_router
from app.routes.teams import router as teams_router

app = FastAPI(title="Markaz", version="0.1.0")
app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(employees_router)

(BACKEND_DIR / "uploads").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=BACKEND_DIR / "uploads"), name="uploads")


@app.get("/api/health")
def health() -> dict:
    return {"data": {"status": "ok"}}
