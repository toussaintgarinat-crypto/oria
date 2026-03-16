from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import models.world, models.building, models.user, models.quartier, models.dm, models.network
from routers import worlds, buildings, rooms, messages, presence, tokens, auth, quartiers
from routers import invitations, files as files_router, dm as dm_router, network as network_router
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Oria API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router,            prefix="/api/auth",        tags=["Auth"])
app.include_router(worlds.router,          prefix="/api/worlds",      tags=["Worlds"])
app.include_router(buildings.router,       prefix="/api/buildings",   tags=["Buildings"])
app.include_router(rooms.router,           prefix="/api/rooms",       tags=["Rooms"])
app.include_router(messages.router,        prefix="/api/messages",    tags=["Messages"])
app.include_router(presence.router,        prefix="/api/presence",    tags=["Presence"])
app.include_router(tokens.router,          prefix="/api/tokens",      tags=["Tokens"])
app.include_router(quartiers.router,       prefix="/api/quartiers",   tags=["Quartiers"])
app.include_router(invitations.router,     prefix="/api/invitations", tags=["Invitations"])
app.include_router(files_router.router,    prefix="/api/files",       tags=["Files"])
app.include_router(dm_router.router,       prefix="/api/dm",          tags=["DM"])
app.include_router(network_router.router,  prefix="/api/network",     tags=["Network"])

@app.get("/")
def root():
    return {"app": "Oria", "status": "ok", "version": "2.0.0"}
