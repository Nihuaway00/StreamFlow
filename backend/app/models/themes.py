from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Theme(Base):
    __tablename__ = "themes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user_themes = relationship("UserThemes", back_populates="theme", cascade="all, delete-orphan")
    stream_themes = relationship("StreamTheme", back_populates="theme", cascade="all, delete-orphan")

    @property
    def users(self):
        return [ut.user for ut in self.user_themes]

    @property
    def streams(self):
        return [st.stream for st in self.stream_themes]
