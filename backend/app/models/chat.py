from sqlalchemy import Column, UUID, String, Text, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base
from app.utils.uuid import gen_uuid


class MessageStatus(enum.Enum):
    CREATED = "CREATED"
    IN_QUEUE = "IN_QUEUE"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"


class Chat(Base):
    __tablename__ = "chats"

    def __init__(self, **kw):
        self.id = gen_uuid()
        super().__init__(id=self.id, **kw)

    id = Column(UUID, primary_key=True, index=True)
    stream_id = Column(UUID, ForeignKey("streams.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    stream = relationship("Stream", back_populates="chat")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    def __init__(self, **kw):
        self.id = gen_uuid()
        super().__init__(id=self.id, **kw)

    id = Column(UUID, primary_key=True, index=True)
    chat_id = Column(UUID, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    content = Column(Text, nullable=False)
    # Используем Enum для типобезопасности
    status = Column(SQLAlchemyEnum(MessageStatus), default=MessageStatus.CREATED, nullable=False, index=True)
    image_url = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    chat = relationship("Chat", back_populates="messages")
    user = relationship("User", back_populates="messages")