# Frontend - Live Streaming Service

## Быстрый старт

### Требования
- Node.js и npm
- Docker Desktop (уже запущенный)
- Git

### Первый запуск
```bash
cd frontend
start.bat
```

## Что происходит при запуске?

Скрипт `start.bat` автоматически:
1. ✅ Создает `.env` файл (если его нет)
2. 🐳 Запускает в Docker: Backend + Database + Media Server
3. 📦 Устанавливает npm зависимости (если нужно)
4. 🚀 Запускает ваш фронтенд локально

Остановить можно нажав `Ctrl+C` в терминале, где запущен этот батник

## Переменные окружения

Файл `.env` создается автоматически из `.env.example`:
```env
VITE_API_URL=http://localhost:8000
VITE_HLS_BASE_URL=http://localhost:8080
```

## API бекенда

Его просмотреть можно по адресу localhost:8000/docs, после того
как бекенд будет запущен (для этого start.bat).