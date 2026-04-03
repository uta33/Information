from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.notification import Notification, NotificationCategory, Severity
from app.schemas.notification import NotificationListOut, NotificationOut, NotificationUpdate

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListOut)
async def list_notifications(
    category: NotificationCategory | None = None,
    severity: Severity | None = None,
    is_read: bool | None = None,
    is_saved: bool | None = None,
    limit: int = Query(default=30, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    q = select(Notification).options(selectinload(Notification.source)).order_by(Notification.created_at.desc())

    if category is not None:
        q = q.where(Notification.category == category)
    if severity is not None:
        q = q.where(Notification.severity == severity)
    if is_read is not None:
        q = q.where(Notification.is_read == is_read)
    if is_saved is not None:
        q = q.where(Notification.is_saved == is_saved)

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    unread_count = await db.scalar(select(func.count()).where(Notification.is_read == False))
    items = (await db.execute(q.limit(limit).offset(offset))).scalars().all()

    return NotificationListOut(
        items=[_to_out(n) for n in items],
        total=total or 0,
        unread_count=unread_count or 0,
    )


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
    """Dashboard summary: counts per category and severity."""
    rows = (await db.execute(
        select(Notification.category, Notification.severity, func.count())
        .where(Notification.is_read == False)
        .group_by(Notification.category, Notification.severity)
    )).all()

    summary = {
        "critical": 0, "high": 0, "ai_unread": 0,
        "it_unread": 0, "security_unread": 0, "total_unread": 0,
    }
    for cat, sev, cnt in rows:
        summary["total_unread"] += cnt
        if sev == Severity.critical:
            summary["critical"] += cnt
        elif sev == Severity.high:
            summary["high"] += cnt
        if cat == NotificationCategory.ai:
            summary["ai_unread"] += cnt
        elif cat == NotificationCategory.it:
            summary["it_unread"] += cnt
        elif cat == NotificationCategory.security:
            summary["security_unread"] += cnt

    return summary


@router.patch("/{notification_id}", response_model=NotificationOut)
async def update_notification(
    notification_id: str,
    body: NotificationUpdate,
    db: AsyncSession = Depends(get_db),
):
    notification = await db.get(Notification, notification_id, options=[selectinload(Notification.source)])
    if not notification:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")

    if body.is_read is not None:
        notification.is_read = body.is_read
    if body.is_saved is not None:
        notification.is_saved = body.is_saved
    if body.read_progress is not None:
        notification.read_progress = body.read_progress

    await db.commit()
    await db.refresh(notification)
    return _to_out(notification)


@router.post("/read-all")
async def mark_all_read(
    category: NotificationCategory | None = None,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import update
    q = update(Notification).where(Notification.is_read == False)
    if category:
        q = q.where(Notification.category == category)
    await db.execute(q.values(is_read=True))
    await db.commit()
    return {"ok": True}


def _to_out(n: Notification) -> NotificationOut:
    return NotificationOut(
        id=n.id,
        source_id=n.source_id,
        source_name=n.source.name if n.source else "",
        external_id=n.external_id,
        title=n.title,
        body=n.body,
        url=n.url,
        category=n.category,
        severity=n.severity,
        cvss_score=n.cvss_score,
        is_read=n.is_read,
        is_saved=n.is_saved,
        read_progress=n.read_progress,
        published_at=n.published_at,
        created_at=n.created_at,
    )
