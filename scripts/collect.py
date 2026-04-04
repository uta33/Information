#!/usr/bin/env python3
"""
InfoWatch standalone collector.
Reads sources from frontend/public/data/sources.json,
fetches RSS/CVE/JVN items, merges with existing notifications.json,
and writes updated JSON files.

No FastAPI or SQLAlchemy required – runs in GitHub Actions.
"""

import asyncio
import hashlib
import json
import os
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

import feedparser
import httpx

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "frontend" / "public" / "data"
SOURCES_FILE = DATA_DIR / "sources.json"
NOTIFICATIONS_FILE = DATA_DIR / "notifications.json"
SUMMARY_FILE = DATA_DIR / "summary.json"
MAX_ITEMS = 500


# ─── Data types ─────────────────────────────────────────────────────────────

@dataclass
class Item:
    id: str
    content_hash: str
    source_name: str
    external_id: str
    title: str
    body: str
    url: str
    category: str          # security / ai / it / general
    severity: str          # critical / high / medium / low / info
    cvss_score: float | None
    published_at: str | None  # ISO 8601
    created_at: str


def cvss_to_severity(score: float) -> str:
    if score >= 9.0:
        return "critical"
    if score >= 7.0:
        return "high"
    if score >= 4.0:
        return "medium"
    if score > 0:
        return "low"
    return "info"


def content_hash(source_name: str, external_id: str, title: str) -> str:
    key = f"{source_name}:{external_id}:{title}"
    return hashlib.sha256(key.encode()).hexdigest()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─── RSS Collector ───────────────────────────────────────────────────────────

def collect_rss(source: dict) -> list[Item]:
    name = source["name"]
    url = source["url"]
    category = source.get("category", "general")

    feed = feedparser.parse(url)
    items: list[Item] = []

    for entry in feed.entries[:50]:
        ext_id = entry.get("id") or entry.get("link") or ""
        title = entry.get("title", "（タイトルなし）")
        body = _rss_body(entry)
        link = entry.get("link", "")
        pub = _rss_date(entry)
        sev = _infer_severity(title + " " + body)
        h = content_hash(name, ext_id, title)

        items.append(Item(
            id=h[:16],
            content_hash=h,
            source_name=name,
            external_id=ext_id,
            title=title,
            body=body[:2000],
            url=link,
            category=category,
            severity=sev,
            cvss_score=None,
            published_at=pub,
            created_at=now_iso(),
        ))

    return items


def _rss_body(entry) -> str:
    if "summary" in entry:
        return entry.summary
    if "content" in entry and entry.content:
        return entry.content[0].get("value", "")
    return ""


def _rss_date(entry) -> str | None:
    for attr in ("published", "updated"):
        val = entry.get(attr)
        if val:
            try:
                return parsedate_to_datetime(val).astimezone(timezone.utc).isoformat()
            except Exception:
                pass
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        return datetime(*parsed[:6], tzinfo=timezone.utc).isoformat()
    return None


def _infer_severity(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["critical", "緊急", "remote code execution", "rce", "zero-day", "ゼロデイ"]):
        return "critical"
    if any(k in t for k in ["high", "vulnerability", "脆弱性", "exploit", "breach", "侵害"]):
        return "high"
    return "info"


# ─── CVE / NVD Collector ────────────────────────────────────────────────────

def collect_cve(source: dict) -> list[Item]:
    name = source["name"]
    api_key = os.environ.get("NVD_API_KEY", "")

    now = datetime.now(timezone.utc)
    start = now - timedelta(hours=25)
    params = {
        "pubStartDate": start.strftime("%Y-%m-%dT%H:%M:%S.000"),
        "pubEndDate": now.strftime("%Y-%m-%dT%H:%M:%S.000"),
        "resultsPerPage": 50,
    }
    headers = {"apiKey": api_key} if api_key else {}

    try:
        resp = httpx.get(
            "https://services.nvd.nist.gov/rest/json/cves/2.0",
            params=params, headers=headers, timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[CVE] fetch error: {e}", file=sys.stderr)
        return []

    items: list[Item] = []
    for vuln in data.get("vulnerabilities", []):
        cve = vuln.get("cve", {})
        cve_id = cve.get("id", "")
        descs = cve.get("descriptions", [])
        body = next((d["value"] for d in descs if d.get("lang") == "en"), "")
        published = cve.get("published")
        pub = datetime.fromisoformat(published.replace("Z", "+00:00")).isoformat() if published else None

        score = _nvd_score(cve)
        sev = cvss_to_severity(score) if score else "info"
        title = f"{cve_id} - {body[:80]}..." if len(body) > 80 else f"{cve_id} - {body}"
        h = content_hash(name, cve_id, title)

        items.append(Item(
            id=h[:16],
            content_hash=h,
            source_name=name,
            external_id=cve_id,
            title=title,
            body=body[:2000],
            url=f"https://nvd.nist.gov/vuln/detail/{cve_id}",
            category="security",
            severity=sev,
            cvss_score=score,
            published_at=pub,
            created_at=now_iso(),
        ))

    return items


def _nvd_score(cve: dict) -> float | None:
    metrics = cve.get("metrics", {})
    for key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        entries = metrics.get(key, [])
        if entries:
            return entries[0].get("cvssData", {}).get("baseScore")
    return None


# ─── JVN Collector ──────────────────────────────────────────────────────────

def collect_jvn(source: dict) -> list[Item]:
    name = source["name"]
    url = source.get("url", "https://jvndb.jvn.jp/ja/rss/jvndb.rdf")

    feed = feedparser.parse(url)
    items: list[Item] = []

    for entry in feed.entries[:50]:
        jvn_id = entry.get("id", "")
        title = entry.get("title", "")
        summary = entry.get("summary", "")
        link = entry.get("link", "")
        pub = _rss_date(entry)
        score = _extract_cvss(summary)
        sev = cvss_to_severity(score) if score else "info"
        h = content_hash(name, jvn_id, title)

        items.append(Item(
            id=h[:16],
            content_hash=h,
            source_name=name,
            external_id=jvn_id,
            title=title,
            body=summary[:2000],
            url=link,
            category="security",
            severity=sev,
            cvss_score=score,
            published_at=pub,
            created_at=now_iso(),
        ))

    return items


def _extract_cvss(text: str) -> float | None:
    m = re.search(r"CVSS[^\d]*([\d]+\.[\d]+)", text)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    return None


# ─── Main ────────────────────────────────────────────────────────────────────

def load_sources() -> list[dict]:
    if not SOURCES_FILE.exists():
        print(f"[warn] {SOURCES_FILE} not found", file=sys.stderr)
        return []
    with open(SOURCES_FILE, encoding="utf-8") as f:
        return json.load(f)


def load_existing() -> dict[str, dict]:
    """Returns dict keyed by content_hash."""
    if not NOTIFICATIONS_FILE.exists():
        return {}
    with open(NOTIFICATIONS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    return {item["content_hash"]: item for item in data.get("items", [])}


def build_summary(items: list[dict]) -> dict:
    summary = {"critical": 0, "high": 0, "ai_unread": 0, "it_unread": 0, "security_unread": 0, "total": len(items)}
    for item in items:
        sev = item.get("severity", "info")
        cat = item.get("category", "general")
        if sev == "critical":
            summary["critical"] += 1
        elif sev == "high":
            summary["high"] += 1
        if cat == "ai":
            summary["ai_unread"] += 1
        elif cat == "it":
            summary["it_unread"] += 1
        elif cat == "security":
            summary["security_unread"] += 1
    return summary


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    sources = load_sources()
    existing = load_existing()

    print(f"Loaded {len(existing)} existing notifications")
    print(f"Processing {len(sources)} sources...")

    new_count = 0
    for source in sources:
        if not source.get("enabled", True):
            continue
        src_type = source.get("type", "rss")
        name = source.get("name", "?")
        print(f"  → {name} ({src_type})")

        try:
            if src_type == "rss":
                items = collect_rss(source)
            elif src_type == "cve":
                items = collect_cve(source)
            elif src_type == "jvn":
                items = collect_jvn(source)
            else:
                print(f"    [warn] unknown type: {src_type}", file=sys.stderr)
                continue
        except Exception as e:
            print(f"    [error] {e}", file=sys.stderr)
            continue

        for item in items:
            if item.content_hash not in existing:
                existing[item.content_hash] = asdict(item)
                new_count += 1

    print(f"New items: {new_count}")

    # Sort by published_at desc, keep latest MAX_ITEMS
    all_items = sorted(
        existing.values(),
        key=lambda x: x.get("published_at") or x.get("created_at") or "",
        reverse=True,
    )[:MAX_ITEMS]

    generated_at = datetime.now(timezone.utc).isoformat()

    # Write notifications.json
    with open(NOTIFICATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump({"generated_at": generated_at, "items": all_items}, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(all_items)} items → {NOTIFICATIONS_FILE}")

    # Write summary.json
    summary = build_summary(all_items)
    summary["generated_at"] = generated_at
    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"Wrote summary → {SUMMARY_FILE}")


if __name__ == "__main__":
    main()
