"""Photo upload service: save, delete, resolve URL."""

from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.config import BACKEND_DIR

UPLOADS_DIR = BACKEND_DIR / "uploads"
PHOTOS_DIR = UPLOADS_DIR / "employees"
MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_PHOTO_EXT = {"jpg", "jpeg", "png", "webp"}


def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def save_employee_photo(employee_id: int, upload: UploadFile) -> str:
    """Save the upload, return the relative path stored in DB (photo_path)."""
    ext = _extension(upload.filename or "")
    if ext not in ALLOWED_PHOTO_EXT:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="نوع الملف غير مدعوم، استخدم JPG أو PNG أو WebP",
        )

    data = upload.file.read()
    if len(data) > MAX_PHOTO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)",
        )

    try:
        Image.open(BytesIO(data)).verify()
    except (UnidentifiedImageError, Exception) as err:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الملف ليس صورة صالحة",
        ) from err

    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    target = PHOTOS_DIR / f"{employee_id}.{ext}"
    for candidate in PHOTOS_DIR.glob(f"{employee_id}.*"):
        if candidate != target:
            candidate.unlink()
    target.write_bytes(data)
    return f"/uploads/employees/{target.name}"


def delete_employee_photo(employee_id: int) -> None:
    if not PHOTOS_DIR.exists():
        return
    for candidate in PHOTOS_DIR.glob(f"{employee_id}.*"):
        candidate.unlink()
