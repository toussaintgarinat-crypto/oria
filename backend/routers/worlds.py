from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.world import World, Member
from models.building import Building, Room
from models.user import User
from routers.auth import get_current_user
import uuid
import services.matrix_service as matrix

router = APIRouter()

class CreerWorld(BaseModel):
    nom:         str
    description: str = ""
    emoji:       str = "🌍"
    couleur:     str = "#5865F2"

class UpdateWorld(BaseModel):
    nom:         str = ""
    description: str = ""
    emoji:       str = ""
    couleur:     str = ""

def _serialise_membres(membres, db: Session) -> list:
    """Retourne les membres avec leur matrix_user_id (joint depuis la table users)."""
    user_ids = [m.user_id for m in membres]
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
    return [
        {
            "user_id": m.user_id,
            "nom": m.nom,
            "avatar_emoji": m.avatar_emoji,
            "role": m.role,
            "matrix_user_id": users.get(m.user_id, {}) and users[m.user_id].matrix_user_id,
        }
        for m in membres
    ]


def serialise_building(b):
    rooms = [{"id": r.id, "nom": r.nom, "type": r.type, "etage": r.etage,
              "emoji": r.emoji, "matrix_room_id": r.matrix_room_id} for r in b.rooms]
    return {"id": b.id, "nom": b.nom, "type": b.type, "emoji": b.emoji,
            "couleur": b.couleur, "description": b.description,
            "quartier_id": b.quartier_id, "rooms": rooms}

@router.get("/")
def lister_worlds(db: Session = Depends(get_db), user=Depends(get_current_user)):
    membres = db.query(Member).filter(Member.user_id == user["id"]).all()
    world_ids = [m.world_id for m in membres]
    worlds = db.query(World).filter(World.id.in_(world_ids)).all() if world_ids else []
    return [{"id": w.id, "nom": w.nom, "description": w.description,
             "emoji": w.emoji, "couleur": w.couleur, "owner_id": w.owner_id,
             "nb_membres": len(w.members), "nb_buildings": len(w.buildings)} for w in worlds]

@router.post("/")
def creer_world(data: CreerWorld, db: Session = Depends(get_db), user=Depends(get_current_user)):
    world = World(id=str(uuid.uuid4()), nom=data.nom, description=data.description,
                  emoji=data.emoji, couleur=data.couleur, owner_id=user["id"])
    db.add(world)
    membre = Member(world_id=world.id, user_id=user["id"], nom=user["nom"],
                    avatar_emoji=user["avatar_emoji"], role="proprietaire")
    db.add(membre)
    db.commit()
    db.refresh(world)
    return {"id": world.id, "nom": world.nom, "emoji": world.emoji, "couleur": world.couleur}

@router.get("/{world_id}")
def get_world(world_id: str, db: Session = Depends(get_db)):
    world = db.query(World).filter(World.id == world_id).first()
    if not world:
        return {"erreur": "Monde introuvable"}
    buildings_libres = [serialise_building(b) for b in world.buildings if b.quartier_id is None]
    quartiers = [{"id": q.id, "nom": q.nom, "emoji": q.emoji, "couleur": q.couleur,
                  "description": q.description,
                  "buildings": [serialise_building(b) for b in q.buildings]}
                 for q in world.quartiers]
    return {"id": world.id, "nom": world.nom, "description": world.description,
            "emoji": world.emoji, "couleur": world.couleur, "owner_id": world.owner_id,
            "buildings": buildings_libres, "quartiers": quartiers,
            "membres": _serialise_membres(world.members, db)}

@router.patch("/{world_id}")
def modifier_world(world_id: str, data: UpdateWorld, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(World).filter(World.id == world_id).first()
    if not w or w.owner_id != user["id"]:
        raise HTTPException(status_code=403, detail="Interdit")
    if data.nom:                     w.nom         = data.nom
    if data.description is not None: w.description = data.description
    if data.emoji:                   w.emoji       = data.emoji
    if data.couleur:                 w.couleur     = data.couleur
    db.commit()
    return {"id": w.id, "nom": w.nom, "emoji": w.emoji, "couleur": w.couleur}

@router.delete("/{world_id}")
def supprimer_world(world_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(World).filter(World.id == world_id).first()
    if not w or w.owner_id != user["id"]:
        raise HTTPException(status_code=403, detail="Interdit")
    db.delete(w)
    db.commit()
    return {"status": "ok"}

@router.get("/{world_id}/membres")
def get_membres(world_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    membres = db.query(Member).filter(Member.world_id == world_id).all()
    return _serialise_membres(membres, db)

@router.patch("/{world_id}/membres/{user_id}")
def modifier_role(world_id: str, user_id: str, role: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(World).filter(World.id == world_id).first()
    if not w or w.owner_id != user["id"]:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut changer les rôles")
    m = db.query(Member).filter(Member.world_id == world_id, Member.user_id == user_id).first()
    if m:
        m.role = role
        db.commit()
    return {"status": "ok"}

@router.delete("/{world_id}/membres/{user_id}")
def exclure_membre(world_id: str, user_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(World).filter(World.id == world_id).first()
    if not w or w.owner_id != user["id"]:
        raise HTTPException(status_code=403, detail="Interdit")
    m = db.query(Member).filter(Member.world_id == world_id, Member.user_id == user_id).first()
    if m:
        db.delete(m)
        db.commit()
    return {"status": "ok"}

@router.post("/{world_id}/rejoindre")
def rejoindre_world(world_id: str, user_id: str, nom: str, avatar_emoji: str = "👤", db: Session = Depends(get_db)):
    existe = db.query(Member).filter(Member.world_id == world_id, Member.user_id == user_id).first()
    if not existe:
        db.add(Member(world_id=world_id, user_id=user_id, nom=nom,
                      avatar_emoji=avatar_emoji, role="membre"))
        db.commit()

        # Inviter le nouveau membre dans toutes les Matrix Rooms du world
        nouveau = db.query(User).filter(User.id == user_id).first()
        if nouveau and nouveau.matrix_user_id:
            rooms = (db.query(Room)
                     .join(Building, Room.building_id == Building.id)
                     .filter(Building.world_id == world_id, Room.matrix_room_id.isnot(None))
                     .all())
            # Utiliser le premier propriétaire comme invitant
            owner = db.query(Member).filter(
                Member.world_id == world_id, Member.role == "proprietaire"
            ).first()
            owner_user = db.query(User).filter(User.id == owner.user_id).first() if owner else None
            inviter_mxid = owner_user.matrix_user_id if owner_user else None

            if inviter_mxid:
                for room in rooms:
                    matrix.invite_to_room(room.matrix_room_id, nouveau.matrix_user_id, inviter_mxid)

    return {"status": "ok"}
