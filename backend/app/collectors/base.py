from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime

from app.models.notification import NotificationCategory, Severity


@dataclass
class RawItem:
    external_id: str
    title: str
    body: str
    url: str
    published_at: datetime | None
    severity: Severity = Severity.info
    category: NotificationCategory = NotificationCategory.general
    cvss_score: float | None = None
    metadata: dict = field(default_factory=dict)


class BaseCollector(ABC):
    def __init__(self, source_id: str, source_url: str, category: NotificationCategory):
        self.source_id = source_id
        self.source_url = source_url
        self.category = category

    @abstractmethod
    async def fetch(self) -> list[RawItem]:
        """Fetch raw items from the source."""

    def cvss_to_severity(self, score: float) -> Severity:
        if score >= 9.0:
            return Severity.critical
        elif score >= 7.0:
            return Severity.high
        elif score >= 4.0:
            return Severity.medium
        elif score > 0:
            return Severity.low
        return Severity.info
