from sqlalchemy import Column, Integer, String

from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=False)
    name = Column(String(255), unique=False, nullable=False, index=False)
