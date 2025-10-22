@echo off
echo 🚀 Starting frontend development environment...

REM Создаем .env если его нет
if not exist .env (
    echo 📝 Creating .env from .env.example...
    copy .env.example .env
)

REM Запускаем Docker сервисы
echo 🐳 Starting Docker services (Backend + Postgres + Media Server)...
docker-compose -f docker-compose.dev.yml up -d

REM Ждем запуска сервисов
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Устанавливаем зависимости если нужно
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Запускаем фронтенд
echo ✅ Starting frontend on http://localhost:5173
echo 🔌 Backend API on http://localhost:8000
echo 🎬 HLS on http://localhost:8080
echo.
npm run dev