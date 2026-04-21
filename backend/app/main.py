from fastapi import FastAPI

from app.auth.routes import router as auth_router
from app.routes.teams import router as teams_router

app = FastAPI(title="Markaz", version="0.1.0")
app.include_router(auth_router)
app.include_router(teams_router)


@app.get("/api/health")
def health() -> dict:
    return {"data": {"status": "ok"}}
