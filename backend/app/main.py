from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, init_roles
from app.api import auth, streams, webhooks

# Создание таблиц
Base.metadata.create_all(bind=engine)

# Инициализация ролей
init_roles()

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

# Подключение роутеров
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(streams.router, prefix="/api/streams", tags=["streams"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])

@app.get("/")
def read_root():
    return {"message": "Streaming Service API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "ok"}