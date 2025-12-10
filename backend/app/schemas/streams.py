from datetime import datetime
from typing import Optional

from pydantic import BaseModel, UUID4, ConfigDict

from app.schemas import ChatResponse


class StreamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    theme_ids: Optional[list[int]] = None


class StreamEdit(BaseModel):
    title: str | None = None
    description: str | None = None
    theme_ids: Optional[list[int]] = None
    remove_preview: bool = False


class StreamAuthor(BaseModel):
    id: UUID4
    username: str

    model_config = ConfigDict(from_attributes=True)


class StreamCreateResponse(BaseModel):
    id: UUID4
    title: str
    description: Optional[str]
    status: str
    stream_key: str
    rtmp_url: str
    hls_url: Optional[str]
    preview_url: Optional[str] = None
    created_at: datetime
    chat: ChatResponse

    model_config = ConfigDict(from_attributes=True)


class StreamPublic(BaseModel):
    id: UUID4
    title: str
    description: Optional[str]
    started_at: Optional[datetime]
    status: str
    viewers_count: int
    preview_url: Optional[str] = None
    author: StreamAuthor
    themes: list[int] = []
    chat: ChatResponse

    is_deleted: bool = False
    deleted_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StreamDetail(StreamPublic):
    hls_url: Optional[str]
    model_config = ConfigDict(from_attributes=True)


class StreamListResponse(BaseModel):
    items: list[StreamPublic]
    total: int
    page: int
    pages: int
