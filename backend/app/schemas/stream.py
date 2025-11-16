from datetime import datetime
from typing import Optional

from pydantic import BaseModel, UUID4


class StreamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    theme_ids: Optional[list[int]] = None


class StreamAuthor(BaseModel):
    id: UUID4
    username: str

    class Config:
        from_attributes = True


class StreamResponse(BaseModel):
    id: UUID4
    title: str
    description: Optional[str]
    status: str
    stream_key: str
    rtmp_url: str
    hls_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class StreamPublic(BaseModel):
    id: UUID4
    title: str
    description: Optional[str]
    status: str
    viewers_count: int
    started_at: Optional[datetime]
    author: StreamAuthor
    themes: list[int] = []

    class Config:
        from_attributes = True


class StreamDetail(BaseModel):
    id: UUID4
    title: str
    description: Optional[str]
    status: str
    viewers_count: int
    hls_url: Optional[str]
    started_at: Optional[datetime]
    author: StreamAuthor
    created_at: datetime
    themes: list[int] = []

    class Config:
        from_attributes = True


class StreamListResponse(BaseModel):
    items: list[StreamPublic]
    total: int
    page: int
    pages: int


class StreamMy(BaseModel):
    id: UUID4
    title: str
    status: str
    stream_key: str
    rtmp_url: str
    viewers_count: int
    themes: list[int] = []

    class Config:
        from_attributes = True
