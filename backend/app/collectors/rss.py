import asyncio
import hashlib
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser

from app.collectors.base import BaseCollector, RawItem
from app.models.notification import NotificationCategory, Severity


class RSSCollector(BaseCollector):
    async def fetch(self) -> list[RawItem]:
        loop = asyncio.get_event_loop()
        feed = await loop.run_in_executor(None, feedparser.parse, self.source_url)

        items: list[RawItem] = []
        for entry in feed.entries:
            published_at = self._parse_date(entry)
            external_id = entry.get("id") or entry.get("link") or hashlib.md5(entry.get("title", "").encode()).hexdigest()
            body = self._extract_body(entry)

            items.append(RawItem(
                external_id=external_id,
                title=entry.get("title", "（タイトルなし）"),
                body=body,
                url=entry.get("link", ""),
                published_at=published_at,
                severity=self._infer_severity(entry.get("title", "") + " " + body),
                category=self.category,
            ))
        return items

    def _parse_date(self, entry) -> datetime | None:
        for attr in ("published", "updated"):
            val = entry.get(attr)
            if val:
                try:
                    return parsedate_to_datetime(val).astimezone(timezone.utc)
                except Exception:
                    pass
        parsed = entry.get("published_parsed") or entry.get("updated_parsed")
        if parsed:
            return datetime(*parsed[:6], tzinfo=timezone.utc)
        return None

    def _extract_body(self, entry) -> str:
        if "summary" in entry:
            return entry.summary[:2000]
        if "content" in entry and entry.content:
            return entry.content[0].get("value", "")[:2000]
        return ""

    def _infer_severity(self, text: str) -> Severity:
        text_lower = text.lower()
        critical_keywords = ["critical", "緊急", "remote code execution", "rce", "zero-day", "ゼロデイ"]
        high_keywords = ["high", "vulnerability", "脆弱性", "exploit", "breach", "侵害"]
        if any(kw in text_lower for kw in critical_keywords):
            return Severity.critical
        if any(kw in text_lower for kw in high_keywords):
            return Severity.high
        return Severity.info
