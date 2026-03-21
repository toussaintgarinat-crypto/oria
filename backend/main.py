from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import models.world, models.building, models.user, models.quartier, models.dm, models.network
from routers import worlds, buildings, rooms, tokens, auth, quartiers
from routers import invitations, files as files_router, network as network_router
from routers import matrix_as
from sqlalchemy import text
import os

Base.metadata.create_all(bind=engine)

# Migration légère — ajoute les colonnes si elles n'existent pas encore
def _migrate():
    nouvelles_colonnes = [
        ("files", "building_id", "TEXT"),
        ("files", "world_id",    "TEXT"),
    ]
    with engine.connect() as conn:
        for table, col, typ in nouvelles_colonnes:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {typ}"))
                conn.commit()
            except Exception:
                pass  # colonne déjà présente

_migrate()

app = FastAPI(title="Oria API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_default_upload = "/app/uploads"
try:
    os.makedirs(_default_upload, exist_ok=True)
    UPLOAD_DIR = _default_upload
except OSError:
    UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
    os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router,            prefix="/api/auth",        tags=["Auth"])
app.include_router(worlds.router,          prefix="/api/worlds",      tags=["Worlds"])
app.include_router(buildings.router,       prefix="/api/buildings",   tags=["Buildings"])
app.include_router(rooms.router,           prefix="/api/rooms",       tags=["Rooms"])
app.include_router(tokens.router,          prefix="/api/tokens",      tags=["Tokens"])
app.include_router(quartiers.router,       prefix="/api/quartiers",   tags=["Quartiers"])
app.include_router(invitations.router,     prefix="/api/invitations", tags=["Invitations"])
app.include_router(files_router.router,    prefix="/api/files",       tags=["Files"])
app.include_router(network_router.router,  prefix="/api/network",     tags=["Network"])
# Application Service Matrix — montée sans préfixe /api (protocole Matrix)
app.include_router(matrix_as.router, tags=["Matrix AS"])

@app.get("/")
def root():
    return {"app": "Oria", "status": "ok", "version": "2.0.0"}
