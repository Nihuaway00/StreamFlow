from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
	# Database
	DATABASE_URL: str = "postgresql://user:password@postgres:5432/streaming_db"

	# JWT
	SECRET_KEY: str = "your-secret-key-change-in-production"
	ALGORITHM: str = "HS256"
	ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

	# Media Server
	RTMP_SERVER_HOST: str = "media-server"
	RTMP_PORT: int = 1935
	HLS_BASE_URL: str = "http://localhost:8080"

	# API
	API_HOST: str = "0.0.0.0"
	API_PORT: int = 8000

	class Config:
		# Приоритет файлов env:
		# 1. Сначала ищет .env.local (для локальной разработки)
		# 2. Если не найден, использует .env (для Docker)
		env_file = ".env.local" if os.path.exists(".env.local") else ".env"
		env_file_encoding = "utf-8"


settings = Settings()