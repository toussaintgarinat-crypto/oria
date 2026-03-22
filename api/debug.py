from fastapi import FastAPI
import sys, os

app = FastAPI()

@app.get("/api/debug")
def debug():
    errors = []

    # Test 1 : path
    backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
    sys.path.insert(0, backend_path)

    # Test 2 : imports
    try:
        import database
        errors.append("database: OK")
    except Exception as e:
        errors.append(f"database: FAIL — {e}")

    try:
        import models.user
        errors.append("models.user: OK")
    except Exception as e:
        errors.append(f"models.user: FAIL — {e}")

    try:
        from sqlalchemy import text
        from database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        errors.append("db connection: OK")
    except Exception as e:
        errors.append(f"db connection: FAIL — {e}")

    return {"results": errors, "backend_path": backend_path, "cwd": os.getcwd()}
