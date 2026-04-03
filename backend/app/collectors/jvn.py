import asyncio
import re
from datetime import datetime, timezone

import feedparser

from app.collectors.base import BaseCollector, RawItem
from app.models.notification import NotificationCategory

JVN_RSS_URL = "https://jvndb.jvn.jp/ja/rss/jvndb.rdf"


class JVNCollector(BaseCollector):
    def __init__(self, source_id: str, source_url: str = JVN_RSS_URL, category: NotificationCategory = NotificationCategory.security):
        super().__init__(source_id, source_url, category)

    async def fetch(self) -> list[RawItem]:
        loop = asyncio.get_event_loop()
        feed = await loop.run_in_executor(None, feedparser.parse, self.source_url)

        items: list[RawItem] = []
        for entry in feed.entries[:50]:
            jvn_id = entry.get("id", "")
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            link = entry.get("link", "")
            published_at = self._parse_date(entry)
            cvss_score = self._extract_cvss_from_text(summary)
            severity = self.cvss_to_severity(cvss_score) if cvss_score else self.cvss_to_severity(0)

            items.append(RawItem(
                external_id=jvn_id,
                title=title,
                body=summary[:2000],
                url=link,
                published_at=published_at,
                severity=severity,
                category=NotificationCategory.security,
                cvss_score=cvss_score,
            ))

        return items

    def _parse_date(self, entry) -> datetime | None:
        parsed = entry.get("published_parsed") or entry.get("updated_parsed")
        if parsed:
            return datetime(*parsed[:6], tzinfo=timezone.utc)
        return None

    def _extract_cvss_from_text(self, text: str) -> float | None:
        match = re.search(r"CVSS[^\d]*([\d]+\.[\d]+)", text)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
        return None
