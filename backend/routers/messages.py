from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.building import Message, Reaction
from routers.auth import get_current_user
import uuid
from datetime import datetime
import json

router = APIRouter()

_connexions: dict[str, list] = {}

class EnvoyerMessage(BaseModel):
    room_id:      str
    author_nom:   str
    author_emoji: str = "👤"
    author_id:    str = ""
    contenu:      str

class AddReaction(BaseModel):
    user_id:  str
    user_nom: str
    emoji:    str

def grouper_reactions(reactions):
    grouped = {}
    for rx in reactions:
        if rx.emoji not in grouped:
            grouped[rx.emoji] = {"emoji": rx.emoji, "count": 0, "users": []}
        grouped[rx.emoji]["count"] += 1
        grouped[rx.emoji]["users"].append(rx.user_id)
    return list(grouped.values())

@router.get("/{room_id}")
def get_messages(room_id: str, db: Session = Depends(get_db)):
    msgs = db.query(Message).filter(Message.room_id == room_id).order_by(Message.created_at).limit(100).all()
    return [{"id": m.id, "author_nom": m.author_nom, "author_emoji": m.author_emoji,
             "author_id": m.author_id, "contenu": m.contenu, "created_at": m.created_at,
             "reactions": grouper_reactions(m.reactions)} for m in msgs]

@router.post("/")
async def envoyer(data: EnvoyerMessage, db: Session = Depends(get_db)):
    msg = Message(id=str(uuid.uuid4()), room_id=data.room_id,
                  author_nom=data.author_nom, author_emoji=data.author_emoji,
                  author_id=data.author_id,
                  contenu=data.contenu, created_at=datetime.utcnow().isoformat())
    db.add(msg)
    db.commit()
    payload = {"id": msg.id, "author_nom": msg.author_nom, "author_emoji": msg.author_emoji,
               "author_id": msg.author_id, "contenu": msg.contenu,
               "created_at": msg.created_at, "reactions": []}
    for ws in list(_connexions.get(data.room_id, [])):
        try:
            await ws.send_json(payload)
        except Exception:
            pass
    return payload

@router.delete("/{message_id}")
async def supprimer_message(message_id: str, db: Session = Depends(get_db)):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if msg:
        room_id = msg.room_id
        db.delete(msg)
        db.commit()
        payload = {"type": "delete", "message_id": message_id}
        for ws in list(_connexions.get(room_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                pass
    return {"status": "ok"}

@router.post("/{message_id}/reactions")
async def reagir(message_id: str, data: AddReaction, db: Session = Depends(get_db)):
    existante = db.query(Reaction).filter(
        Reaction.message_id == message_id,
        Reaction.user_id == data.user_id,
        Reaction.emoji == data.emoji
    ).first()
    if existante:
        db.delete(existante)
    else:
        db.add(Reaction(message_id=message_id, user_id=data.user_id,
                        user_nom=data.user_nom, emoji=data.emoji))
    db.commit()
    msg = db.query(Message).filter(Message.id == message_id).first()
    rxs = grouper_reactions(msg.reactions) if msg else []
    payload = {"type": "reactions", "message_id": message_id, "reactions": rxs}
    if msg:
        for ws in list(_connexions.get(msg.room_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                pass
    return payload

@router.websocket("/ws/{room_id}")
async def ws_messages(ws: WebSocket, room_id: str):
    await ws.accept()
    _connexions.setdefault(room_id, []).append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        if room_id in _connexions:
            _connexions[room_id] = [c for c in _connexions[room_id] if c != ws]
