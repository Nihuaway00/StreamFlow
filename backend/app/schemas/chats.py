from enum import Enum

from pydantic import BaseModel, UUID4


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"

class ChatResponse(BaseModel):
    id: UUID4
