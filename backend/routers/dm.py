from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.dm import DirectMessage
from routers.auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter()
_dm_connexions: dict[str, list] = {}

class EnvoyerDM(BaseModel):
    world_id:   str
    to_user_id: str
    contenu:    str

@router.get("/{world_id}/{other_user_id}")
def get_dm(world_id: str, other_user_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    msgs = db.query(DirectMessage).filter(
        DirectMessage.world_id == world_id,
        ((DirectMessage.from_user_id == user["id"]) & (DirectMessage.to_user_id == other_user_id)) |
        ((DirectMessage.from_user_id == other_user_id) & (DirectMessage.to_user_id == user["id"]))
    ).order_by(DirectMessage.created_at).limit(100).all()
    return [{"id": m.id, "from_user_id": m.from_user_id, "from_nom": m.from_nom,
             "from_emoji": m.from_emoji, "to_user_id": m.to_user_id,
             "contenu": m.contenu, "created_at": m.created_at} for m in msgs]

@router.post("/")
async def envoyer_dm(data: EnvoyerDM, db: Session = Depends(get_db), user=Depends(get_current_user)):
    msg = DirectMessage(id=str(uuid.uuid4()), world_id=data.world_id,
                        from_user_id=user["id"], from_nom=user["nom"],
                        from_emoji=user["avatar_emoji"], to_user_id=data.to_user_id,
                        contenu=data.contenu, created_at=datetime.utcnow().isoformat())
    db.add(msg)
    db.commit()
    payload = {"id": msg.id, "from_user_id": msg.from_user_id, "from_nom": msg.from_nom,
               "from_emoji": msg.from_emoji, "to_user_id": msg.to_user_id,
               "contenu": msg.contenu, "created_at": msg.created_at, "world_id": msg.world_id}
    for ws in list(_dm_connexions.get(data.to_user_id, [])) + list(_dm_connexions.get(user["id"], [])):
        try:
            await ws.send_json(payload)
        except Exception:
            pass
    return payload

@router.websocket("/ws/{user_id}")
async def ws_dm(ws: WebSocket, user_id: str):
    await ws.accept()
    _dm_connexions.setdefault(user_id, []).append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        if user_id in _dm_connexions:
            _dm_connexions[user_id] = [c for c in _dm_connexions[user_id] if c != ws]
