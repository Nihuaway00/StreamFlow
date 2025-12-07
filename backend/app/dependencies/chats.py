from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.chats import ChatService


def get_chats_service(db: AsyncSession = Depends(get_db)) -> ChatService:
    return ChatService(db)