from fastapi import FastAPI
import sys, os

app = FastAPI()

@app.get("/api/debug")
def debug():
    backend_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
    sys.path.insert(0, backend_path)

    results = {"backend_path": backend_path, "tests": []}

    modules = [
        ("database", "import database"),
        ("models.user", "import models.user"),
        ("models.world", "import models.world"),
        ("passlib", "from passlib.context import CryptContext"),
        ("jose", "from jose import jwt"),
        ("psycopg2", "import psycopg2"),
        ("pyotp", "import pyotp"),
        ("db_connect", "from database import SessionLocal; from sqlalchemy import text; db=SessionLocal(); db.execute(text('SELECT 1')); db.close()"),
    ]

    for name, code in modules:
        try:
            exec(code)
            results["tests"].append({"module": name, "status": "OK"})
        except Exception as e:
            results["tests"].append({"module": name, "status": "FAIL", "error": str(e)})

    return results
