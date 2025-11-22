from sqlalchemy import Column, UUID, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.utils.uuid import gen_uuid


class Stream(Base):
    __tablename__ = "streams"

    def __init__(self, **kw):
        self.id = gen_uuid()

        super().__init__(id=self.id, **kw)

    id = Column(UUID, primary_key=True, index=True)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text)

    # RTMP credentials
    stream_key = Column(String(64), unique=True, nullable=False, index=True)

    # Status
    status = Column(String(20), default="offline", index=True)  # offline, live, ended

    # Statistics
    viewers_count = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    is_deleted = Column(Boolean())
    deleted_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    # Relationship
    author = relationship("User", back_populates="streams")
    stream_themes = relationship("StreamTheme", back_populates="stream", cascade="all, delete-orphan")

    @property
    def themes(self):
        return [st.theme for st in self.stream_themes]
