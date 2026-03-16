from sqlalchemy import Column, String, Text
from datetime import datetime
import uuid
from database import Base

class DirectMessage(Base):
    __tablename__ = "direct_messages"
    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    world_id     = Column(String, nullable=False)
    from_user_id = Column(String, nullable=False)
    from_nom     = Column(String, nullable=False)
    from_emoji   = Column(String, default="👤")
    to_user_id   = Column(String, nullable=False)
    contenu      = Column(Text, nullable=False)
    created_at   = Column(String, nullable=False)
