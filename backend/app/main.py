from fastapi import FastAPI

app = FastAPI(title="Markaz", version="0.1.0")


@app.get("/api/health")
def health() -> dict:
    return {"data": {"status": "ok"}}
