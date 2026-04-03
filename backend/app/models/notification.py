import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Severity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class NotificationCategory(str, enum.Enum):
    security = "security"
    ai = "ai"
    it = "it"
    general = "general"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id: Mapped[str] = mapped_column(String, ForeignKey("sources.id"), nullable=False)
    external_id: Mapped[str] = mapped_column(String, nullable=False, default="")
    content_hash: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    url: Mapped[str] = mapped_column(String, nullable=False, default="")
    category: Mapped[NotificationCategory] = mapped_column(Enum(NotificationCategory), nullable=False, default=NotificationCategory.general)
    severity: Mapped[Severity] = mapped_column(Enum(Severity), nullable=False, default=Severity.info)
    cvss_score: Mapped[float | None] = mapped_column(nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_saved: Mapped[bool] = mapped_column(Boolean, default=False)
    read_progress: Mapped[int] = mapped_column(Integer, default=0)  # 0-100 percentage
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    source: Mapped["Source"] = relationship(back_populates="notifications")
