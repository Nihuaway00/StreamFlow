@echo off
echo 🚀 Запуск окружения с новым прокси (Nginx)...

REM Проверка прав для hosts файла (опционально)
echo 🔧 Проверка настроек hosts файла...
call add_storage_host.bat

REM Проверяем Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker не запущен! Запусти Docker Desktop.
    pause
    exit /b 1
)

REM Создаем .env если его нет
if not exist .env (
    echo 📝 Создаю .env из .env.example...
    copy .env.example .env 2>nul || (
        echo ❌ Не удалось создать .env
        pause
        exit /b 1
    )
)

echo.
echo 🐳 Останавливаем старые контейнеры...
docker-compose -f docker-compose.dev.yml down

echo.
echo 🔨 ПЕРЕСБИРАЕМ ВСЕ СЕРВИСЫ (важный шаг!)...
echo ===========================================
docker-compose -f docker-compose.dev.yml up -d --build --remove-orphans

if errorlevel 1 (
    echo ❌ Ошибка при сборке!
    pause
    exit /b 1
)

echo.
echo ⏳ Ждем запуска сервисов (30 сек)...
timeout /t 30 /nobreak >nul

echo.
echo 🔍 Проверяем статус сервисов...
docker-compose -f docker-compose.dev.yml ps

echo.
echo 🗄️ Настраиваем MinIO bucket...
docker exec streamflow-storage mc mb dev --ignore-existing 2>nul || (
    echo ⚠️  Bucket уже существует или контейнер не готов
)

echo.
echo ✅ ===========================================
echo ✅ ОКРУЖЕНИЕ ЗАПУЩЕНО С НОВЫМ ПРОКСИ!
echo ✅ ===========================================
echo.
echo 🌐 ДОСТУПНЫЕ СЕРВИСЫ:
echo ====================
echo 📍 Фронтенд (Vite):  http://localhost:5173
echo 🌐 Фронтенд (через прокси): http://localhost
echo 🔌 Бэкенд API:       http://localhost/api
echo 📖 Документация API: http://localhost/docs
echo 🎬 Медиа-сервер:     http://localhost:8080
echo 📺 RTMP стрим:       rtmp://localhost:1935/live
echo 📦 MinIO Консоль:    http://localhost:9090
echo 🗄️  MinIO API:        http://storage:9000 (внутри докера)
echo 🐘 PostgreSQL:       localhost:5432
echo.
echo 📋 ВАЖНЫЕ ИЗМЕНЕНИЯ:
echo • Аватарки работают через storage:9000
echo • Все сервисы доступны без портов через localhost
echo • Nginx проксирует запросы на нужные сервисы
echo.
echo 🚀 Запускаю фронтенд в новом окне...
timeout /t 3 /nobreak >nul

REM Запускаем фронтенд в новом окне
start cmd /k "cd /d "%~dp0" && echo 📦 Устанавливаю зависимости если нужно... && if not exist node_modules (npm install) && echo 🌐 Запускаю фронтенд... && npm run dev"

echo.
echo ⚡ Фронтенд откроется в новом окне
echo 📍 Это окно оставь для управления Docker
echo.
echo 🔗 Проверьте аватарки: http://localhost/api/users/me (или другой endpoint с аватаркой)
echo.
pause