from datetime import datetime

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Message, MessageStatus


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def send_message(self, chat_id: str, user_id: str, message_text: str) -> Message:
        new_message = Message(chat_id=chat_id, user_id=user_id, content=message_text, created_at=datetime.now(),
                              updated_at=datetime.now())

        self.db.add(new_message)
        await self.db.commit()
        await self.db.refresh(new_message, ["user", "chat"])
        return new_message

    async def set_status(self, message_id, new_status: MessageStatus):
        await self.db.execute(
            update(Message).where(Message.id == message_id).values(status=new_status, updated_at=datetime.now()))
        await self.db.commit()
