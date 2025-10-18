# Live Streaming сервис - Техническая документация (MVP)

## 1. Общее описание

Минимальная рабочая версия сервиса для прямых трансляций (live streaming). Стример передает видео через OBS по RTMP протоколу, система конвертирует в HLS для просмотра зрителями.

**Процесс:**
1. Стример создает "канал" для трансляции через веб-интерфейс
2. Получает RTMP URL и Stream Key
3. Настраивает OBS и начинает трансляцию
4. Зрители смотрят через HLS плеер в браузере

## 2. Архитектура системы

```
┌─────────────┐ RTMP      ┌──────────────────┐ HLS       ┌──────────────┐
│     OBS     │──────────▶│ Media Server     │──────────▶│   Viewers    │
│  (Streamer) │           │ (RTMP → HLS)     │           │  (Browser)   │
└─────────────┘           └──────────────────┘           └──────────────┘
                                   │
                                   │ Webhook
                                   ▼
                          ┌──────────────────┐
                          │   Backend API    │
                          │    (FastAPI)     │
                          └──────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │   PostgreSQL     │
                          │   (метаданные)   │
                          └──────────────────┘
```

## 3. Backend API

### 3.1 Технологический стек
- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **Auth**: JWT (python-jose)
- **Password**: bcrypt

### 3.4 API Endpoints

#### POST /api/auth/register
Регистрация нового пользователя
```json
Request:
{
    "email": "user@example.com",
    "username": "username",
    "password": "password123"
}

Response: 201
{
    "id": 1,
    "email": "user@example.com",
    "username": "username"
}
```

#### POST /api/auth/login
Авторизация
```json
Request:
{
    "email": "user@example.com",
    "password": "password123"
}

Response: 200
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
}
```

#### POST /api/auth/logout
Выход
```json
Response: 200
{
    "message": "Successfully logged out"
}
```

#### POST /api/streams
Создать новый канал для трансляции
**Headers**: `Authorization: Bearer <token>`

```json
Request:
{
    "title": "My Gaming Stream",
    "description": "Playing Dota 2"
}

Response: 201
{
    "id": 1,
    "title": "My Gaming Stream",
    "description": "Playing Dota 2",
    "status": "offline",
    "stream_key": "live_a1b2c3d4e5f6g7h8",
    "rtmp_url": "rtmp://localhost:1935/live",
    "hls_url": "http://localhost:8080/live/live_a1b2c3d4e5f6g7h8/index.m3u8",
    "created_at": "2025-10-18T10:00:00Z"
}
```

**Важно:** `stream_key` - это уникальный секретный ключ для стримера. Его нужно использовать в OBS.

#### GET /api/streams
Получить список всех стримов
```
Query params:
- page: int (default: 1)
- limit: int (default: 20)
- status: string (optional: "live", "offline", "ended")

Response: 200
{
    "items": [
        {
            "id": 1,
            "title": "Gaming Stream",
            "description": "Playing games",
            "status": "live",
            "viewers_count": 42,
            "started_at": "2025-10-18T10:00:00Z",
            "author": {
                "username": "streamer123"
            }
        },
        {
            "id": 2,
            "title": "Cooking Show",
            "status": "offline",
            "author": {
                "username": "chef_anna"
            }
        }
    ],
    "total": 42,
    "page": 1,
    "pages": 3
}
```

#### GET /api/streams/{id}
Получить информацию о конкретном стриме
```json
Response: 200
{
    "id": 1,
    "title": "Gaming Stream",
    "description": "Playing Dota 2",
    "status": "live",
    "viewers_count": 42,
    "hls_url": "http://localhost:8080/live/live_a1b2c3d4e5f6g7h8/index.m3u8",
    "started_at": "2025-10-18T10:00:00Z",
    "author": {
        "id": 1,
        "username": "streamer123"
    },
    "created_at": "2025-10-18T09:00:00Z"
}
```

**Примечание:** Если `status == "offline"`, поле `hls_url` будет `null`.

#### GET /api/streams/my
Получить свои стримы (только авторизованный пользователь)
**Headers**: `Authorization: Bearer <token>`

```json
Response: 200
{
    "items": [
        {
            "id": 1,
            "title": "My Stream",
            "status": "live",
            "stream_key": "live_a1b2c3d4e5f6g7h8",  // Показывается только владельцу
            "rtmp_url": "rtmp://localhost:1935/live",
            "viewers_count": 42
        }
    ]
}
```

### 3.5 Webhook Endpoints (от Media Server)

#### POST /api/webhooks/stream/publish
Вызывается когда стример начинает трансляцию

```json
Request:
{
    "stream_key": "live_a1b2c3d4e5f6g7h8",
    "action": "publish"
}

Response: 200
{
    "status": "ok"
}
```

**Действия Backend:**
1. Найти stream по stream_key
2. Обновить status на "live"
3. Установить started_at

#### POST /api/webhooks/stream/unpublish
Вызывается когда стример завершает трансляцию

```json
Request:
{
    "stream_key": "live_a1b2c3d4e5f6g7h8",
    "action": "unpublish"
}

Response: 200
{
    "status": "ok"
}
```

**Действия Backend:**
1. Найти stream по stream_key
2. Обновить status на "ended"
3. Установить ended_at

### 3.6 Конфигурация (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/streaming_db

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Media Server
RTMP_SERVER_HOST=media-server
RTMP_PORT=1935
HLS_BASE_URL=http://localhost:8080

# API
API_HOST=0.0.0.0
API_PORT=8000
```

### 3.7 Requirements.txt
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic==2.5.0
pydantic-settings==2.1.0
httpx==0.25.2
```

---

## 4. Media Server (RTMP → HLS)

### 4.1 Выбор решения

Используем **nginx-rtmp-module** - стабильный и проверенный временем сервер для RTMP.

**Что он делает:**
- Принимает RTMP стрим от OBS
- Конвертирует в HLS на лету (с помощью FFmpeg)
- Раздает HLS через HTTP
- Отправляет webhooks в Backend API

### 4.2 Структура проекта
```
media_server/
├── nginx.conf                  # Конфигурация nginx
├── Dockerfile
└── scripts/
    ├── on_publish.sh           # Webhook при старте стрима
    └── on_unpublish.sh         # Webhook при остановке
```

### 4.3 Nginx конфигурация

```nginx
# nginx.conf
worker_processes auto;
rtmp_auto_push on;

events {
    worker_connections 1024;
}

# RTMP сервер
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        # Приложение для live стримов
        application live {
            live on;
            record off;
            
            # HLS настройки
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3s;
            hls_playlist_length 20s;
            
            # Webhooks в Backend
            on_publish http://backend:8000/api/webhooks/stream/publish;
            on_publish_done http://backend:8000/api/webhooks/stream/unpublish;
            
            # Проверка stream_key через Backend
            # on_publish http://backend:8000/api/webhooks/stream/validate;
        }
    }
}

# HTTP сервер для раздачи HLS
http {
    server {
        listen 8080;
        
        # CORS для веб-плееров
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods 'GET, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'Range,DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type' always;
        
        location /live {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /tmp/hls;
            add_header Cache-Control no-cache;
        }
        
        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
        
        location /stat.xsl {
            root /usr/local/nginx/html;
        }
    }
}
```

### 4.4 Webhook скрипты

#### on_publish.sh
```bash
#!/bin/bash
STREAM_KEY=$1

curl -X POST http://backend:8000/api/webhooks/stream/publish \
  -H "Content-Type: application/json" \
  -d "{\"stream_key\": \"$STREAM_KEY\", \"action\": \"publish\"}"
```

#### on_unpublish.sh
```bash
#!/bin/bash
STREAM_KEY=$1

curl -X POST http://backend:8000/api/webhooks/stream/unpublish \
  -H "Content-Type: application/json" \
  -d "{\"stream_key\": \"$STREAM_KEY\", \"action\": \"unpublish\"}"
```

### 4.5 Dockerfile
```dockerfile
FROM alfg/nginx-rtmp:latest

# Копируем конфигурацию
COPY nginx.conf /etc/nginx/nginx.conf

# Копируем webhook скрипты
COPY scripts/ /etc/nginx/scripts/
RUN chmod +x /etc/nginx/scripts/*.sh

# Создаем директорию для HLS
RUN mkdir -p /tmp/hls

EXPOSE 1935 8080

CMD ["nginx", "-g", "daemon off;"]
```

### 4.6 Структура HLS файлов

```
/tmp/hls/
└── live_a1b2c3d4e5f6g7h8/        # Название = stream_key
    ├── index.m3u8                 # Playlist
    ├── index-0.ts                 # Видео сегменты (3 сек каждый)
    ├── index-1.ts
    ├── index-2.ts
    └── ...
```

**URL для просмотра:**
```
http://localhost:8080/live/live_a1b2c3d4e5f6g7h8/index.m3u8
```

---

## 5. Docker Compose

### 5.1 docker-compose.yml
```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: streaming_postgres
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: streaming_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Backend API
  backend:
    build: ./backend
    container_name: streaming_backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    env_file:
      - ./backend/.env
    depends_on:
      - postgres

  # Media Server (nginx-rtmp)
  media-server:
    build: ./media_server
    container_name: streaming_media
    ports:
      - "1935:1935"  # RTMP
      - "8080:8080"  # HLS
    volumes:
      - hls_data:/tmp/hls
    depends_on:
      - backend

volumes:
  postgres_data:
  hls_data:
```

### 5.2 Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование кода
COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 6. Настройка OBS

### 6.1 Параметры Stream
После создания стрима через API, пользователь получает:
- **RTMP URL**: `rtmp://localhost:1935/live`
- **Stream Key**: `live_a1b2c3d4e5f6g7h8`

### 6.2 Настройки в OBS
```
Settings → Stream
- Service: Custom
- Server: rtmp://localhost:1935/live
- Stream Key: live_a1b2c3d4e5f6g7h8
```

### 6.3 Рекомендуемые параметры вывода
```
Settings → Output → Streaming
- Encoder: x264
- Rate Control: CBR
- Bitrate: 2500 Kbps (для 720p)
- Keyframe Interval: 2
- CPU Usage Preset: veryfast
- Profile: main
```

### 6.4 Видео настройки
```
Settings → Video
- Base Resolution: 1920x1080
- Output Resolution: 1280x720
- FPS: 30
```

---

## 7. Просмотр стрима (Frontend)

### 7.1 Используя Video.js (рекомендуется)
```html
<!DOCTYPE html>
<html>
<head>
    <link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet" />
    <script src="https://vjs.zencdn.net/8.6.1/video.min.js"></script>
</head>
<body>
    <video id="my-video" class="video-js vjs-default-skin" controls preload="auto" width="640" height="360">
        <source src="http://localhost:8080/live/live_a1b2c3d4e5f6g7h8/index.m3u8" type="application/x-mpegURL">
    </video>
    
    <script>
        var player = videojs('my-video');
    </script>
</body>
</html>
```

### 7.2 Используя HLS.js
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body>
    <video id="video" controls width="640" height="360"></video>
    
    <script>
        var video = document.getElementById('video');
        var videoSrc = 'http://localhost:8080/live/live_a1b2c3d4e5f6g7h8/index.m3u8';
        
        if (Hls.isSupported()) {
            var hls = new Hls();
            hls.loadSource(videoSrc);
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoSrc;
        }
    </script>
</body>
</html>
```

---

## 8. Запуск системы

### 8.1 Первый запуск
```bash
# 1. Создать структуру проекта
mkdir streaming-service
cd streaming-service
mkdir -p backend media_server/scripts

# 2. Скопировать файлы конфигурации
cp backend/.env.example backend/.env

# 3. Запустить все сервисы
docker-compose up -d

# 4. Применить миграции БД
docker-compose exec backend alembic upgrade head
```

### 8.2 Проверка работы
```bash
# Проверить статус
docker-compose ps

# Логи Backend
docker-compose logs -f backend

# Логи Media Server
docker-compose logs -f media-server

# RTMP статистика
curl http://localhost:8080/stat
```

### 8.3 Тестовый сценарий
```bash
# 1. Регистрация
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "streamer@test.com", "username": "streamer", "password": "pass123"}'

# 2. Логин
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "streamer@test.com", "password": "pass123"}' \
  | jq -r '.access_token')

# 3. Создать канал
curl -X POST http://localhost:8000/api/streams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Stream", "description": "Testing"}'

# Результат покажет stream_key и rtmp_url

# 4. Настроить OBS с полученными данными и начать стрим

# 5. Проверить список стримов
curl http://localhost:8000/api/streams
```

---

## 9. Масштабирование

### 9.1 Для большего количества зрителей

**Проблема:** Один nginx-rtmp сервер ограничен ~1000 одновременными зрителями.

**Решение:**
1. **CDN**: Использовать CloudFlare Stream или AWS CloudFront для раздачи HLS
2. **Edge серверы**: Развернуть несколько nginx серверов в разных регионах
3. **Load Balancer**: Распределять зрителей по edge серверам

### 9.2 Для большего количества стримеров

**Решение:**
- Горизонтальное масштабирование media-server
- Load Balancer перед RTMP серверами
- Динамическое распределение стримеров

### 9.3 Простой вариант (до 100 стримов)
```yaml
# В docker-compose.yml
docker-compose up -d --scale media-server=3
```