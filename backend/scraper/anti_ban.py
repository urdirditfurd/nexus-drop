"""Scraper — rotation User-Agent et délais anti-ban."""

from __future__ import annotations

import asyncio
import logging
import random

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]


def random_user_agent() -> str:
    try:
        from fake_useragent import UserAgent

        return UserAgent(browsers=["chrome", "firefox"]).random
    except Exception:
        return random.choice(USER_AGENTS)


async def random_delay(min_s: float = 0.5, max_s: float = 2.0) -> None:
    delay = random.uniform(min_s, max_s)
    logger.debug("Anti-ban sleep %.1fs", delay)
    await asyncio.sleep(delay)


def playwright_context_options() -> dict:
    return {
        "user_agent": random_user_agent(),
        "locale": "fr-FR",
        "viewport": {"width": 1366, "height": 768},
    }
