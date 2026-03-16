from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.user import User
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os

router = APIRouter()

SECRET_KEY   = os.getenv("JWT_SECRET", "oria-secret-dev-change-en-prod")
ALGORITHM    = "HS256"
EXPIRE_JOURS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─── Modèles Pydantic ────────────────────────────────────────────────────────

class Inscription(BaseModel):
    email: str
    nom: str
    avatar_emoji: str = "👤"
    password: str

class Connexion(BaseModel):
    email: str
    password: str

# ─── Helpers ─────────────────────────────────────────────────────────────────

def creer_token(user: User) -> str:
    expire = datetime.utcnow() + timedelta(days=EXPIRE_JOURS)
    payload = {
        "sub": user.id,
        "nom": user.nom,
        "avatar_emoji": user.avatar_emoji,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Dépendance FastAPI — lit le token Bearer et retourne l'utilisateur."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id      = payload.get("sub")
        nom          = payload.get("nom")
        avatar_emoji = payload.get("avatar_emoji")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        return {"id": user_id, "nom": nom, "avatar_emoji": avatar_emoji}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/register")
def register(data: Inscription, db: Session = Depends(get_db)):
    """Créer un compte. Retourne un token JWT."""
    existant = db.query(User).filter(User.email == data.email).first()
    if existant:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email=data.email,
        nom=data.nom,
        avatar_emoji=data.avatar_emoji,
        hashed_password=pwd_context.hash(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = creer_token(user)
    return {
        "token": token,
        "user": {"id": user.id, "nom": user.nom, "avatar_emoji": user.avatar_emoji},
    }

@router.post("/login")
def login(data: Connexion, db: Session = Depends(get_db)):
    """Se connecter. Retourne un token JWT."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd_context.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    token = creer_token(user)
    return {
        "token": token,
        "user": {"id": user.id, "nom": user.nom, "avatar_emoji": user.avatar_emoji},
    }
