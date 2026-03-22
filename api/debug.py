from fastapi import FastAPI

app = FastAPI()

@app.get("/api/debug")
def debug():
    return {"status": "ok", "message": "FastAPI fonctionne"}
