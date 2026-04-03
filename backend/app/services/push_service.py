import json
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.notification import Notification
from app.models.push_subscription import PushSubscription

logger = logging.getLogger(__name__)


async def fan_out(db: AsyncSession, notification: Notification) -> None:
    """Send Web Push notification to all subscriptions."""
    if not settings.vapid_private_key or not settings.vapid_public_key:
        logger.warning("VAPID keys not configured, skipping push notification")
        return

    subscriptions = (await db.execute(select(PushSubscription))).scalars().all()
    if not subscriptions:
        return

    severity_emoji = {
        "critical": "🔴",
        "high": "🟠",
        "medium": "🟡",
        "low": "🔵",
        "info": "ℹ️",
    }
    emoji = severity_emoji.get(notification.severity, "ℹ️")

    payload = json.dumps({
        "title": f"{emoji} {notification.title}",
        "body": notification.body[:120] + "..." if len(notification.body) > 120 else notification.body,
        "url": notification.url,
        "notificationId": notification.id,
        "severity": notification.severity,
        "category": notification.category,
    })

    stale_ids: list[str] = []
    for sub in subscriptions:
        try:
            from pywebpush import webpush, WebPushException
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={
                    "sub": f"mailto:{settings.vapid_subscriber_email}",
                },
            )
        except Exception as e:
            err_str = str(e)
            if "410" in err_str or "404" in err_str:
                stale_ids.append(sub.id)
            else:
                logger.error("Push failed for %s: %s", sub.endpoint[:30], e)

    for sub_id in stale_ids:
        sub = await db.get(PushSubscription, sub_id)
        if sub:
            await db.delete(sub)
    if stale_ids:
        await db.commit()
