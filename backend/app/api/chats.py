import logging
from uuid import UUID

import math
from fastapi import APIRouter, HTTPException
from fastapi import WebSocket
from fastapi.params import Depends, Query
from sqlalchemy import select, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette import status

from app.database import get_db, AsyncSessionLocal
from app.dependencies.chats import get_chats_service
from app.models import MessageStatus, User, Message, Chat
from app.schemas import OutgoingMessage, MessageChangeStatus, ChatResponse, SortOrder
from app.schemas.messages import MessageAuthor
from app.services.chats import ChatService
from app.utils.security import get_ws_user, get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)




@router.post("/{chat_id}/messages", summary='Возвращает список сообщений чата по страницам. Время отправки сообщений указано по гринвичу')
async def get_messages(
        chat_id: UUID,
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        sort: SortOrder = Query(SortOrder.DESC, description="Сортировка по дате отправки"),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    chat_exists = ((await db.execute(select(Chat).where(Chat.id == chat_id)))
                   .scalars()
                   .first())

    if not chat_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )

    order_func = desc if sort == SortOrder.DESC else asc

    query = (select(Message)
             .options(selectinload(Message.user))
             .options(selectinload(Message.chat))
             .where(Message.chat_id == chat_id)
             .order_by(order_func(Message.created_at))
             )

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    pages = math.ceil(total / limit)

    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    messages = result.scalars().all()

    items = [
        OutgoingMessage(
            id=m.id,
            author=MessageAuthor(id=m.user.id, username=m.user.username, avatar_url=m.user.avatar_url),
            chat=ChatResponse(id=m.chat.id),
            content=m.content,
            created_at=m.created_at
        )
        for m in messages
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages
    }


rooms: dict[str, set[WebSocket]] = {}


@router.websocket("/{chat_id}")
async def send_message(
        websocket: WebSocket,
        chat_id: str,
        token: str
):
    # Создаем сессию только для проверки токена
    async with AsyncSessionLocal() as db:
        user = await get_ws_user(token, db)

    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()

    # Добавляем в комнату
    if chat_id not in rooms:
        rooms[chat_id] = set()
    rooms[chat_id].add(websocket)

    msg = None
    try:
        while True:
            data = await websocket.receive_text()

            # Создаем новую сессию для каждой операции
            async with AsyncSessionLocal() as db:
                service = ChatService(db)
                msg = await service.send_message(chat_id, user.id, data)
                
                response = OutgoingMessage(
                    id=msg.id,
                    author=MessageAuthor(id=msg.user.id, username=msg.user.username, avatar_url=msg.user.avatar_url),
                    chat=ChatResponse(id=msg.chat.id),
                    content=msg.content,
                    created_at=msg.created_at
                )

                for ws in rooms[chat_id]:
                    if ws != websocket:  # ← Пропускаем отправителя
                        await ws.send_json(response.model_dump_json())
                await service.set_status(msg.id, MessageStatus.DELIVERED)

                message_change_status = MessageChangeStatus(
                    message_id=msg.id,
                    new_status=MessageStatus.DELIVERED
                )

                await websocket.send_json(message_change_status.model_dump_json())
    except Exception as e:
        logger.error(f"Failed to send to client: {e}")

        if msg:
            async with AsyncSessionLocal() as db:
                service = ChatService(db)
                await service.set_status(msg.id, MessageStatus.FAILED)
            message_change_status = MessageChangeStatus(
                message_id=msg.id,
                new_status=MessageStatus.FAILED
            )

            await websocket.send_json(message_change_status.model_dump_json())
        else:
            await websocket.send_json({"error": "Ошибка при обработке сообщения"})
    finally:
        rooms[chat_id].discard(websocket)
        logger.info(f'Вебсокет {websocket} отключен')
