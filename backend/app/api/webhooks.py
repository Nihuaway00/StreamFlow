import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Form
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.stream import Stream

router = APIRouter()
logger = logging.getLogger(__name__)


class WebhookData(BaseModel):
    stream_key: str
    action: str


@router.post("/stream/publish")
async def stream_publish(
        name: str = Form(...),  # nginx-rtmp отправляет stream key как 'name'
        db: AsyncSession = Depends(get_db)
):
    """
    Webhook вызывается когда стример начинает трансляцию
    nginx-rtmp отправляет данные как application/x-www-form-urlencoded
    """
    logger.info(f"📡 Webhook publish received for stream: {name}")

    stream = (await db.execute(select(Stream).where(Stream.stream_key == name))).scalars().first()

    if not stream:
        logger.error(f"❌ Stream not found: {name}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stream with key '{name}' not found"
        )

    # Обновляем статус
    stream.status = "live"
    stream.started_at = datetime.utcnow()

    await db.commit()
    await db.refresh(stream)

    logger.info(f"✅ Stream '{stream.title}' is now LIVE (id: {stream.id})")

    return {"status": "ok", "message": f"Stream {name} is now live"}


@router.post("/stream/unpublish")
async def stream_unpublish(
        name: str = Form(...),  # nginx-rtmp отправляет stream key как 'name'
        db: AsyncSession = Depends(get_db)
):
    """
    Webhook вызывается когда стример завершает трансляцию
    nginx-rtmp отправляет данные как application/x-www-form-urlencoded
    """
    logger.info(f"📡 Webhook unpublish received for stream: {name}")

    stream = (await db.execute(select(Stream).where(Stream.stream_key == name))).scalars().first()

    if not stream:
        logger.error(f"❌ Stream not found: {name}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stream with key '{name}' not found"
        )

    # Обновляем статус
    stream.status = "ended"
    stream.ended_at = datetime.utcnow()

    await db.commit()
    await db.refresh(stream)

    logger.info(f"✅ Stream '{stream.title}' ended (id: {stream.id})")

    return {"status": "ok", "message": f"Stream {name} ended"}


# Дополнительный endpoint для отладки - показывает что пришло от nginx
@router.post("/stream/debug")
async def stream_debug(
        name: str = Form(None),
        app: str = Form(None),
        addr: str = Form(None),
        call: str = Form(None)
):
    """Debug endpoint для просмотра данных от nginx-rtmp"""
    logger.info(f"🔍 Debug webhook data: name={name}, app={app}, addr={addr}, call={call}")
    return {
        "received": {
            "name": name,
            "app": app,
            "addr": addr,
            "call": call
        }
    }
