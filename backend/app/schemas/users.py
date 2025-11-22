import re
from datetime import datetime, date
from typing import Optional

from pydantic import (
	BaseModel,
	field_validator,
	EmailStr,
	UUID4, Field
)


class UserResponse(BaseModel):
    id: UUID4
    email: EmailStr
    created_at: datetime
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime]

    first_name: Optional[str]
    last_name: Optional[str]
    bio: Optional[str]
    phone: Optional[str]
    date_of_birth: Optional[date]
    country: Optional[str]
    city: Optional[str]
    website: Optional[str]
    avatar_url: Optional[str]

    class Config:
        from_attributes = True


class UserPublicResponse(BaseModel):
    id: UUID4
    email: EmailStr
    created_at: datetime
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime]

    first_name: Optional[str]
    last_name: Optional[str]
    bio: Optional[str]
    phone: Optional[str]
    date_of_birth: Optional[date]
    country: Optional[str]
    city: Optional[str]
    website: Optional[str]
    avatar_url: Optional[str]

    class Config:
        from_attributes = True


class UserEditData(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    country: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = None


    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            # Простой паттерн: +7XXXXXXXXXX или 8XXXXXXXXXX
            if not re.match(r'^[\+]?[0-9]{10,15}$', v):
                raise ValueError('Невалидный формат телефона')
        return v

    @field_validator('date_of_birth')
    @classmethod
    def validate_age(cls, v: Optional[date]) -> Optional[date]:
        if v:
            today = date.today()
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            if age < 18:
                raise ValueError('Минимум 18 лет')
            if age > 100:
                raise ValueError('Проверь дату рождения')
        return v
