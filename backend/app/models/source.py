import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SourceType(str, enum.Enum):
    rss = "rss"
    cve = "cve"
    jvn = "jvn"


class SourceCategory(str, enum.Enum):
    security = "security"
    ai = "ai"
    it = "it"
    general = "general"


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[SourceType] = mapped_column(Enum(SourceType), nullable=False, default=SourceType.rss)
    category: Mapped[SourceCategory] = mapped_column(Enum(SourceCategory), nullable=False, default=SourceCategory.general)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    poll_interval_minutes: Mapped[int] = mapped_column(Integer, default=30)
    last_fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    notifications: Mapped[list["Notification"]] = relationship(back_populates="source", cascade="all, delete-orphan")
