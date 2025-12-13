import logging
from urllib.parse import urlparse, urlunparse, parse_qs

from app.config import settings

from fastapi import APIRouter
from fastapi.params import Depends

from app.core.storage.service import StorageService
from app.dependencies.storage import get_storage

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post('/', description="file_key = папка/название_файла.расширение")
def get_file_url(file_key: str, storage: StorageService = Depends(get_storage)) -> str:
    original_url = storage.get_presigned_url(file_key, 86400)
    parsed_url = urlparse(original_url)
    
    # Извлекаем все компоненты
    scheme = parsed_url.scheme
    path = parsed_url.path
    params = parsed_url.params
    query = parsed_url.query
    fragment = parsed_url.fragment
    
    # Формируем новый URL
    new_url = f"http://{settings.API_HOST}:{settings.API_PORT}/files{path}"
    
        
    new_url = urlunparse((
        'http',  # схема остается http
        f"{settings.API_HOST}:{settings.API_PORT}",  # новый хост и порт
        f"/files{path}",  # добавляем префикс /files к пути
        params,  # сохраняем параметры
        query,  # сохраняем query-параметры
        fragment  # сохраняем фрагмент
    ))
    
    return new_url