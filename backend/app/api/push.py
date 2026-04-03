from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.push_subscription import PushSubscription
from app.schemas.push_subscription import PushSubscriptionCreate, PushSubscriptionOut

router = APIRouter(prefix="/api/push", tags=["push"])


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"public_key": settings.vapid_public_key}


@router.post("/subscribe", response_model=PushSubscriptionOut, status_code=201)
async def subscribe(body: PushSubscriptionCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(PushSubscription).where(PushSubscription.endpoint == body.endpoint))
    if existing:
        return existing

    sub = PushSubscription(endpoint=body.endpoint, p256dh=body.p256dh, auth=body.auth)
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


@router.delete("/subscribe")
async def unsubscribe(endpoint: str, db: AsyncSession = Depends(get_db)):
    sub = await db.scalar(select(PushSubscription).where(PushSubscription.endpoint == endpoint))
    if sub:
        await db.delete(sub)
        await db.commit()
    return {"ok": True}


@router.post("/test")
async def send_test_push(db: AsyncSession = Depends(get_db)):
    """Send a test push notification to all subscriptions."""
    from app.models.notification import Notification, NotificationCategory, Severity
    from app.services import push_service

    dummy = Notification(
        id="test",
        source_id="test",
        external_id="test",
        content_hash="test",
        title="InfoWatch テスト通知",
        body="プッシュ通知が正常に動作しています",
        url="/",
        category=NotificationCategory.general,
        severity=Severity.info,
    )
    await push_service.fan_out(db, dummy)
    return {"ok": True}
