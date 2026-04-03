from datetime import datetime

from pydantic import BaseModel

from app.models.source import SourceCategory, SourceType


class SourceCreate(BaseModel):
    name: str
    url: str
    type: SourceType = SourceType.rss
    category: SourceCategory = SourceCategory.general
    poll_interval_minutes: int = 30


class SourceOut(BaseModel):
    id: str
    name: str
    url: str
    type: SourceType
    category: SourceCategory
    is_enabled: bool
    poll_interval_minutes: int
    last_fetched_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SourceUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    category: SourceCategory | None = None
    is_enabled: bool | None = None
    poll_interval_minutes: int | None = None
