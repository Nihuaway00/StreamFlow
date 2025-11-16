from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, UUID4


class UserResponse(BaseModel):
	id: UUID4
	email: EmailStr
	created_at: datetime
	is_active: bool
	is_verified: bool
	last_login: bool

	first_name: Optional[str]
	last_name: Optional[str]
	bio: Optional[str]
	phone: Optional[str]
	date_of_birth: Optional[datetime]
	country: Optional[str]
	city: Optional[str]
	website: Optional[str]

	class Config:
		from_attributes = True


class UserEditData(BaseModel):
	id: UUID4
	first_name: Optional[str]
	last_name: Optional[str]
	bio: Optional[str]
	phone: Optional[str]
	date_of_birth: Optional[datetime]
	country: Optional[str]
	city: Optional[str]
	website: Optional[str]
