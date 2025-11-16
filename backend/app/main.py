from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, streams, webhooks, users, themes
from app.database import init_roles, init_themes

# Инициализация ролей


app = FastAPI(
    title="Streaming Service API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        await init_roles()
        await init_themes()
    except Exception as e:
        print(f"STARTUP FAILED: {e}")
        raise  # Убей приложение, если инит не прошёл


# Подключение роутеров
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(streams.router, prefix="/api/streams", tags=["streams"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(themes.router, prefix="/api/themes", tags=["themes"])


@app.get("/")
def read_root():
    return {"message": "Streaming Service API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
