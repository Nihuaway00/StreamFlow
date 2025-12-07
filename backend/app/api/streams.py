from datetime import datetime
from typing import Optional

import math
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.dependencies.streams import get_stream_service
from app.models import Theme, StreamTheme, Chat
from app.models.stream import Stream
from app.models.user import User
from app.schemas import ChatResponse
from app.schemas.streams import (
    StreamCreate, StreamCreateResponse, StreamListResponse,
    StreamDetail, StreamPublic, StreamAuthor, StreamEdit
)
from app.services.streams import StreamService
from app.utils.security import get_current_user, generate_stream_key

router = APIRouter()


@router.post("", response_model=StreamCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_stream(
        stream_data: StreamCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    stream_key = generate_stream_key()

    new_stream = Stream(
        user_id=current_user.id,
        title=stream_data.title,
        description=stream_data.description,
        stream_key=stream_key,
        status="offline",
        is_deleted=False
    )

    if stream_data.theme_ids:
        theme_ids = stream_data.theme_ids
        result = await db.execute(
            select(Theme.id).where(Theme.id.in_(theme_ids))
        )
        existing_ids = set(result.scalars().all())

        # Проверка
        missing = set(theme_ids) - existing_ids
        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Themes with ids {list(missing)} not found"
            )

        for theme_id in theme_ids:
            db.add(StreamTheme(stream_id=new_stream.id, theme_id=theme_id))

    db.add(new_stream)
    await db.commit()
    await db.refresh(new_stream)

    new_chat = Chat(
        stream_id=new_stream.id,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    db.add(new_chat)
    await db.commit()
    await db.refresh(new_chat)

    rtmp_url = f"rtmp://{settings.RTMP_SERVER_HOST}:{settings.RTMP_PORT}/live"
    hls_url = f"{settings.HLS_BASE_URL}/live/{stream_key}/index.m3u8"

    return StreamCreateResponse(
        id=new_stream.id,
        title=new_stream.title,
        description=new_stream.description,
        status=new_stream.status,
        stream_key=stream_key,
        rtmp_url=rtmp_url,
        hls_url=hls_url,
        created_at=new_stream.created_at,
        chat=ChatResponse(id=new_chat.id)
    )


@router.get("", response_model=StreamListResponse)
async def get_streams(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        status: Optional[str] = Query(None),
        show_deleted: Optional[bool] = Query(False),
        db: AsyncSession = Depends(get_db)
):
    # Базовый запрос
    query = (select(Stream)
             .options(selectinload(Stream.author))
             .options(selectinload(Stream.chat))
             .options(selectinload(Stream.stream_themes).selectinload(StreamTheme.theme))
             )

    if status:
        query = query.where(Stream.status == status)

    if not show_deleted:
        query = query.where(Stream.is_deleted == False)

    # Подсчёт total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    pages = math.ceil(total / limit)

    # Получение streams с пагинацией
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    streams = result.scalars().all()

    # Маппинг в Pydantic
    items = [
        StreamPublic(
            id=s.id,
            title=s.title,
            description=s.description,
            status=s.status,
            viewers_count=s.viewers_count,
            started_at=s.started_at,
            author=StreamAuthor(id=s.author.id, username=s.author.username),
            themes=[th.id for th in s.themes],
            is_deleted=s.is_deleted,
            deleted_at=s.deleted_at,
            updatd_at=s.updated_at,
            created_at=s.created_at,
            chat=ChatResponse(id=s.chat.id)
        )
        for s in streams
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages
    }


@router.get("/my")
async def get_my_streams(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    query = (select(Stream)
             .options(selectinload(Stream.author))
             .options(selectinload(Stream.chat))
             .options(selectinload(Stream.stream_themes).selectinload(StreamTheme.theme))
             )
    streams = (await db.execute(query.where(Stream.user_id == current_user.id))).scalars().all()

    hls_url = f"rtmp://{settings.RTMP_SERVER_HOST}:{settings.RTMP_PORT}/live"

    items = [
        StreamDetail(
            id=s.id,
            title=s.title,
            description=s.description,
            status=s.status,
            viewers_count=s.viewers_count,
            started_at=s.started_at,
            author=StreamAuthor(id=s.author.id, username=s.author.username),
            themes=[th.id for th in s.themes],
            is_deleted=s.is_deleted,
            deleted_at=s.deleted_at,
            updatd_at=s.updated_at,
            created_at=s.created_at,
            hls_url=hls_url,
            chat=ChatResponse(id=s.chat.id)
        )
        for s in streams
    ]

    return {"items": items}


@router.get("/{stream_id}", response_model=StreamDetail)
async def get_stream(stream_id: str, db: AsyncSession = Depends(get_db)):
    query = (select(Stream)
             .options(selectinload(Stream.author))
             .options(selectinload(Stream.chat))
             .options(selectinload(Stream.stream_themes).selectinload(StreamTheme.theme))
             )

    stream = (await db.execute(query.where(Stream.id == stream_id))).scalars().first()

    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stream not found"
        )

    hls_url = None
    if stream.status == "live":
        hls_url = f"{settings.HLS_BASE_URL}/live/{stream.stream_key}/index.m3u8"

    return StreamDetail(
        id=stream.id,
        title=stream.title,
        description=stream.description,
        status=stream.status,
        viewers_count=stream.viewers_count,
        hls_url=hls_url,
        started_at=stream.started_at,
        author=StreamAuthor(id=stream.author.id, username=stream.author.username),
        themes=[th.id for th in stream.themes],
        is_deleted=stream.is_deleted,
        deleted_at=stream.deleted_at,
        updatd_at=stream.updated_at,
        created_at=stream.created_at,
        chat=ChatResponse(id=stream.chat.id)
    )


@router.patch("/{stream_id}", response_model=StreamDetail)
async def edit_stream(
        stream_id: str,
        new_data: StreamEdit,
        current_user: User = Depends(get_current_user),
        service: StreamService = Depends(get_stream_service)
):
    update_data = new_data.model_dump(exclude_unset=True)
    return await service.edit_stream(stream_id, update_data, current_user)


@router.delete("/{stream_id}")
async def delete_stream(
        stream_id: str,
        current_user: User = Depends(get_current_user),
        service: StreamService = Depends(get_stream_service),
):
    return await service.delete_stream(stream_id, current_user)
