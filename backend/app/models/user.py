from sqlalchemy import Column, Integer, String, UUID, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.uuid import gen_uuid


class User(Base):
	__tablename__ = "users"

	def __init__(self, **kwargs):
		self.id = gen_uuid()

		super().__init__(id=self.id, **kwargs)

	id = Column(UUID, primary_key=True, index=True)
	email = Column(String(255), unique=True, nullable=False, index=True)
	username = Column(String(50), unique=True, nullable=False, index=True)
	hashed_password = Column(String(255), nullable=False)
	created_at = Column(DateTime(timezone=True), server_default=func.now())

	# Relationship
	streams = relationship("Stream", back_populates="author")
