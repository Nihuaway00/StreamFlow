from datetime import datetime

from fastapi import HTTPException, status
from httpx import delete
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models import User, Stream, StreamTheme, Theme
from app.schemas import StreamDetail, ChatResponse
from app.schemas.streams import StreamAuthor
from app.core.storage.service import StorageService
from app.services.streams.preview import upload_preview


class StreamService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def edit_stream(self, stream_id: str, update_data: dict[str, any], current_user: User, storage: StorageService):
        query = (select(Stream)
                 .options(selectinload(Stream.author))
                 .options(selectinload(Stream.chat))
                 .options(selectinload(Stream.stream_themes).selectinload(StreamTheme.theme)))

        stream = (await self.db.execute(query.where(Stream.id == stream_id))).scalars().first()

        if not stream:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stream not found"
            )

        if current_user.id != stream.author.id:
            raise HTTPException(
                status_code=403,
                detail="This stream created by another user"
            )

        if stream.is_deleted:
            raise HTTPException(
                status_code=400,
                detail="This stream is deleted"
            )

        # Handle preview removal
        if update_data.get("remove_preview", False):
            stream.preview_key = None

        # Handle preview upload
        preview_file = update_data.pop("preview_file", None)
        if preview_file:
            preview_key = upload_preview(storage, preview_file.file, preview_file.filename)
            stream.preview_key = preview_key

        if "theme_ids" in update_data and update_data["theme_ids"] is not None:
            theme_ids = set(update_data["theme_ids"])
            result = await self.db.execute(
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

            await self.db.execute(
                delete(StreamTheme).where(StreamTheme.stream_id == stream_id)
            )

            for theme_id in theme_ids:
                self.db.add(StreamTheme(stream_id=stream.id, theme_id=theme_id))

        # Update other fields
        for field, value in update_data.items():
            if field not in ["theme_ids", "remove_preview", "preview_file"]:
                setattr(stream, field, value)

        hls_url = f"rtmp://{settings.RTMP_SERVER_HOST}:{settings.RTMP_PORT}/live"

        await self.db.commit()
        await self.db.refresh(stream)
        return StreamDetail(
            id=stream.id,
            title=stream.title,
            description=stream.description,
            status=stream.status,
            viewers_count=stream.viewers_count,
            preview_url=stream.preview_key if stream.preview_key else None,
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

    async def delete_stream(self, stream_id: str, current_user: User):
        query = (select(Stream)
                 .options(selectinload(Stream.author))
                 .options(selectinload(Stream.chat))
                 .options(selectinload(Stream.stream_themes).selectinload(StreamTheme.theme)))

        stream: Stream = (await self.db.execute(query.where(Stream.id == stream_id))).scalars().first()

        if not stream:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stream not found"
            )

        if current_user.id != stream.author.id:
            raise HTTPException(
                status_code=403,
                detail="This stream created by another user"
            )

        if stream.is_deleted:
            raise HTTPException(
                status_code=400,
                detail="This stream already deleted"
            )


        stream.is_deleted = True
        stream.deleted_at = datetime.utcnow()

        await self.db.commit()

        return True
