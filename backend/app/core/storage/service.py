from datetime import timedelta
from typing import BinaryIO

from fastapi import HTTPException, status
from minio import Minio, S3Error

from app.core.storage.enums import StorageFolder


class StorageService:
    def __init__(self, client: Minio, bucket_name: str):
        self.client = client
        self.bucket_name = bucket_name

    # Make the bucket if it doesn't exist.
    def check_buckets(self):
        found = self.client.bucket_exists(self.bucket_name)
        if not found:
            self.client.make_bucket(self.bucket_name)
            print("Created bucket", self.bucket_name)
        else:
            print("Bucket", self.bucket_name, "already exists")

    def upload_file(self, file: BinaryIO, folder: StorageFolder, filename: str, content_type: str | None = None) -> str:
        object_name = f"{folder.value}/{filename}"

        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            data=file,
            length=-1,
            content_type=content_type,
            part_size=10 * 1024 * 1024  # 10mb чанк
        )

        return object_name

    def get_presigned_url(self, object_name: str, expires: int = 3600) -> str:
        try:
            self.client.get_object(bucket_name=self.bucket_name, object_name=object_name)
        except S3Error as e:
            if e.code == 'NoSuchKey':
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Файл с таким ключом {object_name} не найден")
            raise e

        return self.client.presigned_get_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            expires=timedelta(seconds=expires),
        )
