import mimetypes
from uuid import uuid4

from app.core.storage.enums import StorageFolder


def upload_avatar(storage, file_stream, original_filename) -> str:
    ext = original_filename.split('.')[-1]  # можно получить из имени файла
    filename = f"{uuid4()}.{ext}"

    content_type = mimetypes.guess_type(filename)[0]

    return storage.upload_file(
        file=file_stream,
        folder=StorageFolder.AVATARS,
        filename=filename,
        content_type=content_type,
    )
