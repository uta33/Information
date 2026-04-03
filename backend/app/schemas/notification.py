from datetime import datetime

from pydantic import BaseModel

from app.models.notification import NotificationCategory, Severity


class NotificationOut(BaseModel):
    id: str
    source_id: str
    source_name: str
    external_id: str
    title: str
    body: str
    url: str
    category: NotificationCategory
    severity: Severity
    cvss_score: float | None
    is_read: bool
    is_saved: bool
    read_progress: int
    published_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationUpdate(BaseModel):
    is_read: bool | None = None
    is_saved: bool | None = None
    read_progress: int | None = None


class NotificationListOut(BaseModel):
    items: list[NotificationOut]
    total: int
    unread_count: int
