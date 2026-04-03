import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.collectors.cve import CVECollector
from app.collectors.jvn import JVNCollector
from app.collectors.rss import RSSCollector
from app.database import AsyncSessionLocal
from app.models.notification import NotificationCategory
from app.models.source import Source, SourceType
from app.services import notification_service, push_service

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")

COLLECTOR_MAP = {
    SourceType.rss: RSSCollector,
    SourceType.cve: CVECollector,
    SourceType.jvn: JVNCollector,
}


async def _run_source(source_id: str, source_url: str, source_type: str, category: str) -> None:
    collector_class = COLLECTOR_MAP.get(SourceType(source_type))
    if not collector_class:
        return

    collector = collector_class(
        source_id=source_id,
        source_url=source_url,
        category=NotificationCategory(category),
    )

    try:
        items = await collector.fetch()
    except Exception as e:
        logger.error("Collector %s failed: %s", source_type, e)
        return

    async with AsyncSessionLocal() as db:
        source = await db.get(Source, source_id)
        if source:
            source.last_fetched_at = datetime.now(timezone.utc)

        new_count = 0
        for item in items:
            notification = await notification_service.save_item(db, source_id, item)
            if notification and notification_service.should_push(notification):
                await push_service.fan_out(db, notification)
                new_count += 1

        await db.commit()
        logger.info("Source %s: %d new notifications", source_id, new_count)


async def register_source(source: Source) -> None:
    job_id = f"source_{source.id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    if not source.is_enabled:
        return

    scheduler.add_job(
        _run_source,
        "interval",
        minutes=source.poll_interval_minutes,
        id=job_id,
        args=[source.id, source.url, source.type, source.category],
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    logger.info("Registered job for source: %s (%s)", source.name, source.id)


async def load_sources_from_db() -> None:
    async with AsyncSessionLocal() as db:
        sources = (await db.execute(select(Source).where(Source.is_enabled == True))).scalars().all()
        for source in sources:
            await register_source(source)
    logger.info("Loaded %d sources from DB", len(sources) if 'sources' in dir() else 0)


async def start_scheduler() -> None:
    await load_sources_from_db()
    scheduler.start()
    logger.info("Scheduler started")


async def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")
