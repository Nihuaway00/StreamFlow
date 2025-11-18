from fastapi.params import Depends
from minio import Minio

from app.config import settings
from app.core.storage.service import StorageService


def get_minio_client() -> Minio:
    return Minio(settings.MINIO_ENDPOINT,
                 access_key=settings.MINIO_ACCESSKEY,
                 secret_key=settings.MINIO_SECRETKEY,
                 secure=False
                 )


def get_storage(client: Minio = Depends(get_minio_client)) -> StorageService:
    return StorageService(client=client, bucket_name=settings.MINIO_BUCKET)
