import logging

from fastapi import Depends, APIRouter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Theme
from app.schemas.theme import ThemeResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get('/', response_model=list[ThemeResponse])
async def get_themes(
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Theme))
    themes = result.scalars().all()

    items = [
        ThemeResponse(
            id=t.id,
            name=t.name,
            description=t.description
        )
        for t in themes
    ]

    return items