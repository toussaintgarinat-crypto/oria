from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

router = APIRouter()

# { world_id: { user_id: { nom, avatar_emoji, room_id } } }
_presence: dict = {}
_connexions: dict = {}  # { world_id: [ws] }

async def _diffuser(world_id: str):
    snapshot = {"type": "presence", "data": _presence.get(world_id, {})}
    for ws in list(_connexions.get(world_id, [])):
        try:
            await ws.send_json(snapshot)
        except Exception:
            pass

@router.websocket("/ws/{world_id}/{user_id}")
async def ws_presence(ws: WebSocket, world_id: str, user_id: str):
    await ws.accept()
    _connexions.setdefault(world_id, []).append(ws)
    _presence.setdefault(world_id, {})
    await _diffuser(world_id)

    try:
        while True:
            data = await ws.receive_json()
            if data.get("type") == "move":
                # L'utilisateur entre dans une room
                _presence[world_id][user_id] = {
                    "nom":          data["nom"],
                    "avatar_emoji": data.get("avatar_emoji", "👤"),
                    "room_id":      data.get("room_id"),
                    "building_id":  data.get("building_id"),
                }
                await _diffuser(world_id)
            elif data.get("type") == "leave":
                _presence[world_id].pop(user_id, None)
                await _diffuser(world_id)
    except WebSocketDisconnect:
        _presence.get(world_id, {}).pop(user_id, None)
        _connexions[world_id] = [c for c in _connexions.get(world_id, []) if c != ws]
        await _diffuser(world_id)

@router.get("/{world_id}")
def get_presence(world_id: str):
    return _presence.get(world_id, {})
