from typing import Optional

import math
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models.stream import Stream
from app.models.user import User
from app.schemas.stream import (
	StreamCreate, StreamResponse, StreamListResponse,
	StreamDetail, StreamMy, StreamPublic, StreamAuthor
)
from app.utils.security import get_current_user, generate_stream_key

router = APIRouter()


@router.post("", response_model=StreamResponse, status_code=status.HTTP_201_CREATED)
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
        status="offline"
    )

    db.add(new_stream)
    await db.commit()
    await db.refresh(new_stream)

    rtmp_url = f"rtmp://{settings.RTMP_SERVER_HOST}:{settings.RTMP_PORT}/live"
    hls_url = f"{settings.HLS_BASE_URL}/live/{stream_key}/index.m3u8"

    return {
        "id": new_stream.id,
        "title": new_stream.title,
        "description": new_stream.description,
        "status": new_stream.status,
        "stream_key": stream_key,
        "rtmp_url": rtmp_url,
        "hls_url": hls_url,
        "created_at": new_stream.created_at
    }


from sqlalchemy import select, func


@router.get("", response_model=StreamListResponse)
async def get_streams(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        status: Optional[str] = Query(None),
        db: AsyncSession = Depends(get_db)
):
    # Базовый запрос
    query = select(Stream).options(selectinload(Stream.author))

    if status:
        query = query.where(Stream.status == status)

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
            author=StreamAuthor(id=s.author.id, username=s.author.username)
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
    streams = (await db.execute(select(Stream).where(Stream.user_id == current_user.id))).scalars().all()

    rtmp_url = f"rtmp://{settings.RTMP_SERVER_HOST}:{settings.RTMP_PORT}/live"

    items = [
        StreamMy(
            id=s.id,
            title=s.title,
            status=s.status,
            stream_key=s.stream_key,
            rtmp_url=rtmp_url,
            viewers_count=s.viewers_count
        )
        for s in streams
    ]

    return {"items": items}


@router.get("/{stream_id}", response_model=StreamDetail)
async def get_stream(stream_id: str, db: AsyncSession = Depends(get_db)):
    stream = (await db.execute(select(Stream).options(selectinload(Stream.author)).where(Stream.id == stream_id))).scalars().first()

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
        created_at=stream.created_at
    )
