from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import math
from app.database import get_db
from app.schemas.stream import (
	StreamCreate, StreamResponse, StreamListResponse,
	StreamDetail, StreamMy, StreamPublic, StreamAuthor
)
from app.models.stream import Stream
from app.models.user import User
from app.utils.security import get_current_user, generate_stream_key
from app.config import settings

router = APIRouter()


@router.post("", response_model=StreamResponse, status_code=status.HTTP_201_CREATED)
def create_stream(
		stream_data: StreamCreate,
		current_user: User = Depends(get_current_user),
		db: Session = Depends(get_db)
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
	db.commit()
	db.refresh(new_stream)

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


@router.get("", response_model=StreamListResponse)
def get_streams(
		page: int = Query(1, ge=1),
		limit: int = Query(20, ge=1, le=100),
		status: Optional[str] = Query(None),
		db: Session = Depends(get_db)
):
	query = db.query(Stream)

	if status:
		query = query.filter(Stream.status == status)

	total = query.count()
	pages = math.ceil(total / limit)

	streams = query.offset((page - 1) * limit).limit(limit).all()

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
def get_my_streams(
		current_user: User = Depends(get_current_user),
		db: Session = Depends(get_db)
):
	streams = db.query(Stream).filter(Stream.user_id == current_user.id).all()

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
def get_stream(stream_id: int, db: Session = Depends(get_db)):
	stream = db.query(Stream).filter(Stream.id == stream_id).first()

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