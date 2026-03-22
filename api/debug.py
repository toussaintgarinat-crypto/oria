from fastapi import FastAPI
import sys, os

app = FastAPI()

@app.get("/api/debug")
def debug():
    backend_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
    sys.path.insert(0, backend_path)

    results = []

    try:
        import database
        results.append("database import: OK")
    except Exception as e:
        results.append(f"database import: FAIL — {e}")
        return {"results": results}

    try:
        from sqlalchemy import text
        from database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        results.append("db connection: OK")
    except Exception as e:
        results.append(f"db connection: FAIL — {e}")

    try:
        import main
        results.append("main import: OK")
    except Exception as e:
        results.append(f"main import: FAIL — {e}")

    return {"results": results}
