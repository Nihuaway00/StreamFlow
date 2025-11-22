from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.streams import StreamService


def get_stream_service(db: AsyncSession = Depends(get_db)) -> StreamService:
    return StreamService(db)