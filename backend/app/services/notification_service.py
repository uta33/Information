import hashlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.collectors.base import RawItem
from app.models.notification import Notification, Severity


def _content_hash(source_id: str, external_id: str, title: str) -> str:
    key = f"{source_id}:{external_id}:{title}"
    return hashlib.sha256(key.encode()).hexdigest()


async def save_item(db: AsyncSession, source_id: str, item: RawItem) -> Notification | None:
    """Persist a RawItem, skipping duplicates. Returns None if duplicate."""
    h = _content_hash(source_id, item.external_id, item.title)

    existing = await db.scalar(select(Notification).where(Notification.content_hash == h))
    if existing:
        return None

    notification = Notification(
        source_id=source_id,
        external_id=item.external_id,
        content_hash=h,
        title=item.title,
        body=item.body,
        url=item.url,
        category=item.category,
        severity=item.severity,
        cvss_score=item.cvss_score,
        published_at=item.published_at,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


def should_push(notification: Notification) -> bool:
    """Only push HIGH and CRITICAL severity notifications."""
    return notification.severity in (Severity.critical, Severity.high)
