from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/api/debug")
def debug():
    url = os.getenv("DATABASE_URL", "NOT SET")
    # Masque le mot de passe mais montre la structure
    safe_url = url
    if "://" in url and "@" in url:
        scheme = url.split("://")[0]
        rest = url.split("@", 1)[1]  # tout après le @
        safe_url = f"{scheme}://***:***@{rest}"

    return {
        "DATABASE_URL_set": url != "NOT SET",
        "DATABASE_URL_structure": safe_url,
        "starts_with_postgresql": url.startswith("postgresql"),
        "length": len(url),
    }
