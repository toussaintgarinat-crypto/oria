from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models.building import File
from routers.auth import get_current_user
from datetime import datetime
import uuid, os, shutil

router = APIRouter()
UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/{room_id}")
async def upload_file(room_id: str, file: UploadFile = FastAPIFile(...),
                      db: Session = Depends(get_db), user=Depends(get_current_user)):
    ext = os.path.splitext(file.filename or "")[1]
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    size = os.path.getsize(path)
    db_file = File(id=file_id, room_id=room_id,
                   uploaded_by=user["id"], uploader_nom=user["nom"],
                   nom=file.filename or filename, taille=size,
                   type_mime=file.content_type or "application/octet-stream",
                   path=filename, created_at=datetime.utcnow().isoformat())
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return {"id": db_file.id, "nom": db_file.nom, "taille": db_file.taille,
            "type_mime": db_file.type_mime, "room_id": room_id,
            "uploader_nom": db_file.uploader_nom, "created_at": db_file.created_at}

@router.get("/room/{room_id}")
def lister_fichiers(room_id: str, db: Session = Depends(get_db)):
    files = db.query(File).filter(File.room_id == room_id).order_by(File.created_at.desc()).all()
    return [{"id": f.id, "nom": f.nom, "taille": f.taille, "type_mime": f.type_mime,
             "uploader_nom": f.uploader_nom, "created_at": f.created_at} for f in files]

@router.get("/download/{file_id}")
def telecharger(file_id: str, db: Session = Depends(get_db)):
    f = db.query(File).filter(File.id == file_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    path = os.path.join(UPLOAD_DIR, f.path)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Fichier manquant")
    return FileResponse(path, filename=f.nom, media_type=f.type_mime)

@router.delete("/{file_id}")
def supprimer_fichier(file_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    f = db.query(File).filter(File.id == file_id).first()
    if f:
        p = os.path.join(UPLOAD_DIR, f.path)
        if os.path.exists(p):
            os.remove(p)
        db.delete(f)
        db.commit()
    return {"status": "ok"}
