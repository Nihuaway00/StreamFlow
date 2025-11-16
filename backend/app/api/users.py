import logging

from fastapi import APIRouter
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.users import UserResponse, UserEditData
from app.utils.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get('/me')
def get_user_data(
        current_user: User = Depends(get_current_user)
):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def edit_user_data(
        new_data: UserEditData,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # exclude_unset=True - игнорирует непереданные поля
    update_data = new_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user
