from fastapi import FastAPI

app = FastAPI(title="Domain Node Platform - Intelligence Engine")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
