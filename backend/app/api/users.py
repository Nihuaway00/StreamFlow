import logging
from io import BytesIO

from fastapi import APIRouter, Form, UploadFile, File
from fastapi.params import Depends
from pydantic.json_schema import SkipJsonSchema
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage.service import StorageService
from app.database import get_db
from app.dependencies.storage import get_storage
from app.models.user import User
from app.schemas.users import UserResponse, UserEditData
from app.services.users.avatar import upload_avatar
from app.utils.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get('/me')
def get_user_data(
        current_user: User = Depends(get_current_user)
):
    return UserResponse.model_validate(current_user)


@router.post("/me", response_model=UserResponse)
async def edit_user_data(
        first_name: str | None = Form(None),
        last_name: str | None = Form(None),
        bio: str | None = Form(None),
        phone: str | None = Form(None),
        date_of_birth: str | None = Form(None),
        country: str | None = Form(None),
        city: str | None = Form(None),
        website: str | None = Form(None),
        avatar: UploadFile | SkipJsonSchema[None] = File(None),
        db: AsyncSession = Depends(get_db),
        storage: StorageService = Depends(get_storage),
        current_user: User = Depends(get_current_user)
):
    # exclude_unset=True - игнорирует непереданные поля

    new_data = UserEditData(
        first_name=first_name,
        last_name=last_name,
        bio=bio,
        phone=phone,
        date_of_birth=date_of_birth,
        country=country,
        city=city,
        website=website
    )

    avatar_url = None
    if avatar:
        content = await avatar.read()
        avatar_url = upload_avatar(storage, BytesIO(content), avatar.filename)

    current_user.avatar_url = avatar_url

    update_data = new_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user
