from datetime import datetime, timedelta, timezone

import httpx

from app.collectors.base import BaseCollector, RawItem
from app.config import settings
from app.models.notification import NotificationCategory


class CVECollector(BaseCollector):
    NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0"

    def __init__(self, source_id: str, source_url: str = NVD_API, category: NotificationCategory = NotificationCategory.security):
        super().__init__(source_id, source_url, category)

    async def fetch(self) -> list[RawItem]:
        now = datetime.now(timezone.utc)
        start = now - timedelta(hours=25)

        params = {
            "pubStartDate": start.strftime("%Y-%m-%dT%H:%M:%S.000"),
            "pubEndDate": now.strftime("%Y-%m-%dT%H:%M:%S.000"),
            "resultsPerPage": 50,
        }

        headers = {}
        if settings.nvd_api_key:
            headers["apiKey"] = settings.nvd_api_key

        items: list[RawItem] = []
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(self.NVD_API, params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()
            except Exception:
                return items

        for vuln in data.get("vulnerabilities", []):
            cve = vuln.get("cve", {})
            cve_id = cve.get("id", "")
            descriptions = cve.get("descriptions", [])
            body = next((d["value"] for d in descriptions if d.get("lang") == "en"), "")
            published = cve.get("published")
            published_at = datetime.fromisoformat(published.replace("Z", "+00:00")) if published else None

            cvss_score = self._extract_cvss(cve)
            severity = self.cvss_to_severity(cvss_score) if cvss_score else self.cvss_to_severity(0)

            items.append(RawItem(
                external_id=cve_id,
                title=f"{cve_id} - {body[:80]}..." if len(body) > 80 else f"{cve_id} - {body}",
                body=body,
                url=f"https://nvd.nist.gov/vuln/detail/{cve_id}",
                published_at=published_at,
                severity=severity,
                category=NotificationCategory.security,
                cvss_score=cvss_score,
            ))

        return items

    def _extract_cvss(self, cve: dict) -> float | None:
        metrics = cve.get("metrics", {})
        for key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
            entries = metrics.get(key, [])
            if entries:
                return entries[0].get("cvssData", {}).get("baseScore")
        return None
