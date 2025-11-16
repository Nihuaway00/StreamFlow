import logging
from typing import Optional

from fastapi import APIRouter
from fastapi.params import Depends, Header
from sqlalchemy.orm import Session
from app.models.user import User

from app.database import get_db
from app.schemas.users import UserResponse, UserEditData
from app.utils.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get('/me')
def get_user_data(
		db: Session = Depends(get_db),
		current_user: User = Depends(get_current_user)
):
	return UserResponse.model_validate(current_user)


# @router.put("/edit", response_model=UserResponse)
# def edit_user_data(
# 		new_data: UserEditData,
# 		db: Session = Depends(get_db),
# 		current_user: User = Depends(get_current_user)
# ):
