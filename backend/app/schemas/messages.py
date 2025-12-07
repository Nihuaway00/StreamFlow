from datetime import datetime

from pydantic import BaseModel, UUID4, ConfigDict

from app.models import MessageStatus
from app.schemas import ChatResponse


class MessageAuthor(BaseModel):
    id: UUID4
    avatar_url: str | None
    username: str

    model_config = ConfigDict(from_attributes=True)


class IncomingMessage(BaseModel):
    user_id: UUID4
    content: str | None = None


# Исходящие (к клиенту)
class OutgoingMessage(BaseModel):
    id: UUID4
    author: MessageAuthor
    chat: ChatResponse
    content: str
    created_at: datetime


class MessageChangeStatus(BaseModel):
    message_id: UUID4
    new_status: MessageStatus
