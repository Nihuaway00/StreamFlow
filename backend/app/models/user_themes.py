from sqlalchemy import Column, Integer, String, DateTime, UUID, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.uuid import gen_uuid

class UserThemes(Base):
    __tablename__ = "user_theme"

    def __init__(self, **kwargs):
        self.id = gen_uuid()
        super().__init__(id=self.id, **kwargs)

    id = Column(UUID, primary_key=True)
    
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    theme_id = Column(Integer, ForeignKey("themes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="user_themes")
    theme = relationship("Theme", back_populates="user_themes")