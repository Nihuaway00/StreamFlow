from sqlalchemy import Column, Integer, String, UUID, DateTime, Text, Boolean # добавил тип данный текст для био
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
	
	# Новые поля для профиля
	first_name = Column(String(100), nullable=True)
	last_name = Column(String(100), nullable=True)
	avatar_url = Column(Text, nullable=True)
	bio = Column(Text, nullable=True)
	phone = Column(String(20), nullable=True)
	date_of_birth = Column(DateTime, nullable=True)
	country = Column(String(100), nullable=True)
	city = Column(String(100), nullable=True)
	website = Column(Text, nullable=True)
	is_active = Column(Boolean, default=True)
	is_verified = Column(Boolean, default=False)
	last_login = Column(DateTime(timezone=True), nullable=True)

	# Relationship
	streams = relationship("Stream", back_populates="author")
