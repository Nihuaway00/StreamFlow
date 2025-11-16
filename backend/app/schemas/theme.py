from typing import Optional

from pydantic import BaseModel


class ThemeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True