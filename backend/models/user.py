from sqlalchemy import Column, String, DateTime
from datetime import datetime
import uuid
from database import Base

class User(Base):
    __tablename__ = "users"
    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email           = Column(String, unique=True, nullable=False)
    nom             = Column(String, nullable=False)
    avatar_emoji    = Column(String, default="👤")
    hashed_password      = Column(String, nullable=False)
    created_at           = Column(DateTime, default=datetime.utcnow)
    matrix_user_id       = Column(String, nullable=True)   # "@oria_<uuid>:oria.local"
    matrix_access_token  = Column(String, nullable=True)
    matrix_provisioned   = Column(String, default="false") # "true" | "false" | "error"
