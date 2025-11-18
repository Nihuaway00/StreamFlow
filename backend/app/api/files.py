import logging

from fastapi import APIRouter
from fastapi.params import Depends

from app.core.storage.service import StorageService
from app.dependencies.storage import get_storage

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post('/', description="file_key = папка/название_файла.расширение")
def get_file_url(file_key: str, storage: StorageService = Depends(get_storage)) -> str:
    return storage.get_presigned_url(file_key, 86400)