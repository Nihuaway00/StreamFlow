#!/bin/bash

echo "🚀 Starting backend development environment..."

# Создаем .env если его нет
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
fi

# Запускаем Docker сервисы
echo "🐳 Starting Docker services (Postgres + Media Server)..."
docker-compose -f docker-compose.dev.yml up -d

# Ждем запуска Postgres
echo "⏳ Waiting for Postgres to be ready..."
sleep 5

# Устанавливаем зависимости если нужно
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv /.venv
fi

echo "📦 Installing dependencies..."
source .venv/bin/activate
pip install -r requirements.txt

# Применяем миграции
echo "🔄 Running database migrations..."
alembic upgrade head

# Запускаем бэкенд
echo "✅ Starting backend on http://localhost:8000"
echo "📊 Database on localhost:5432"
echo "📺 RTMP on localhost:1935"
echo "🎬 HLS on http://localhost:8080"
echo ""
uvicorn app.main:app --reload