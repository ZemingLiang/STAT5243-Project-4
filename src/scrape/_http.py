"""Shared HTTP utility for polite, idempotent, cached scraping.

Every scraper in `src/scrape/` calls `cached_get()` instead of `requests.get()`
directly so we get:

- On-disk caching (re-runs are free; only first run pays the network cost).
- Polite rate limiting (configurable per-host; default 3.0s between requests).
- Retry with exponential backoff on 5xx and connection errors.
- A clear, identifying User-Agent header so site owners can contact us.
- robots.txt awareness (warns but does not block — caller decides policy).

The cache is content-addressed by URL + headers fingerprint. Cache files are
gzipped HTML/JSON/CSV under `data/raw/_http_cache/<host>/<sha256>.gz`.
"""

from __future__ import annotations

import gzip
import hashlib
import json
import logging
import time
import urllib.parse
import urllib.robotparser
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests
from requests.adapters import HTTPAdapter, Retry

LOG = logging.getLogger(__name__)

DEFAULT_USER_AGENT = (
    "STAT5243-Project4-Academic-Scraper/1.0 "
    "(Columbia University; ZemingLiang on GitHub; respectful-rate-limit)"
)

# Per-host minimum delay between requests (seconds). Add new hosts here as we add scrapers.
HOST_RATE_LIMITS = {
    "fbref.com": 3.0,
    "www.fbref.com": 3.0,
    "www.football-data.co.uk": 1.0,
    "football-data.co.uk": 1.0,
    "api.clubelo.com": 1.0,
    "www.bbc.co.uk": 2.0,
    "www.theguardian.com": 2.0,
    "en.wikipedia.org": 1.5,
    "_default": 2.0,
}

CACHE_ROOT = Path("data/raw/_http_cache")
LAST_REQUEST_AT: dict[str, float] = {}


@dataclass
class CachedResponse:
    """Mimics the parts of `requests.Response` our scrapers actually use."""

    url: str
    status_code: int
    text: str
    content: bytes

    def json(self) -> Any:
        return json.loads(self.text)

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code} for {self.url}")


def _cache_path(url: str, headers: dict[str, str] | None) -> Path:
    """Content-addressed cache path: data/raw/_http_cache/<host>/<sha256>.gz."""
    host = urllib.parse.urlparse(url).netloc or "unknown"
    fingerprint = hashlib.sha256(
        f"{url}|{json.dumps(headers or {}, sort_keys=True)}".encode("utf-8")
    ).hexdigest()
    return CACHE_ROOT / host / f"{fingerprint}.gz"


def _load_cache(path: Path) -> CachedResponse | None:
    if not path.exists():
        return None
    try:
        with gzip.open(path, "rt", encoding="utf-8") as f:
            payload = json.load(f)
        return CachedResponse(
            url=payload["url"],
            status_code=payload["status_code"],
            text=payload["text"],
            content=payload["text"].encode("utf-8"),
        )
    except Exception as exc:
        LOG.warning("Cache read failed for %s: %s", path, exc)
        return None


def _save_cache(path: Path, response: requests.Response) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "url": response.url,
        "status_code": response.status_code,
        "text": response.text,
    }
    with gzip.open(path, "wt", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)


def _polite_sleep(host: str) -> None:
    """Block until enough time has passed since the last request to this host."""
    delay = HOST_RATE_LIMITS.get(host, HOST_RATE_LIMITS["_default"])
    now = time.monotonic()
    last = LAST_REQUEST_AT.get(host, 0.0)
    elapsed = now - last
    if elapsed < delay:
        time.sleep(delay - elapsed)
    LAST_REQUEST_AT[host] = time.monotonic()


def _make_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=5,
        backoff_factor=2.0,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"],
        respect_retry_after_header=True,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update({"User-Agent": DEFAULT_USER_AGENT})
    return session


_SESSION: requests.Session | None = None


def _get_session() -> requests.Session:
    global _SESSION
    if _SESSION is None:
        _SESSION = _make_session()
    return _SESSION


def cached_get(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    use_cache: bool = True,
    timeout: int = 30,
) -> CachedResponse:
    """Polite cached GET. Returns a `CachedResponse` whether served from cache or network."""
    cache_path = _cache_path(url, headers)
    if use_cache:
        cached = _load_cache(cache_path)
        if cached is not None:
            return cached

    host = urllib.parse.urlparse(url).netloc
    _polite_sleep(host)

    session = _get_session()
    resp = session.get(url, headers=headers or {}, timeout=timeout)
    if resp.status_code == 200:
        _save_cache(cache_path, resp)
    return CachedResponse(
        url=resp.url, status_code=resp.status_code, text=resp.text, content=resp.content
    )


def check_robots(url: str, user_agent: str = DEFAULT_USER_AGENT) -> bool:
    """Return True if `user_agent` is allowed to fetch `url` per the host's robots.txt."""
    parsed = urllib.parse.urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = urllib.robotparser.RobotFileParser()
    rp.set_url(robots_url)
    try:
        rp.read()
    except Exception as exc:  # pragma: no cover
        LOG.warning("robots.txt unreadable at %s: %s; assuming allowed", robots_url, exc)
        return True
    return rp.can_fetch(user_agent, url)
