"""
Navigateur Playwright furtif — stealth, proxy, retries, détection CAPTCHA.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
from dataclasses import dataclass
from typing import Any

from app.config import settings

# Éviter le cache sandbox Cursor pour les binaires Playwright
_pw_path = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "")
if not _pw_path or "cursor-sandbox-cache" in _pw_path.replace("\\", "/").lower():
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "0"

logger = logging.getLogger(__name__)

SCRAPE_TIMEOUT_S = 30.0
MAX_RETRIES = 2
_PROXY_WARNING_EMITTED = False

CAPTCHA_PATTERNS = re.compile(
    r"captcha|robot|automated access|verify you are human|type the characters|"
    r"saisissez les caractères|nous avons détecté|unusual traffic",
    re.IGNORECASE,
)

STEALTH_INIT_SCRIPT = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr', 'en-US', 'en'] });
window.chrome = { runtime: {} };
const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (parameters) =>
  parameters.name === 'notifications'
    ? Promise.resolve({ state: Notification.permission })
    : originalQuery(parameters);
"""


@dataclass
class ScrapeResult:
    """Résultat d'une tentative de scraping."""

    success: bool
    html: str | None = None
    error: str | None = None
    source: str = ""
    attempt: int = 1
    captcha_detected: bool = False


def _log_proxy_status_once() -> None:
    global _PROXY_WARNING_EMITTED
    if _PROXY_WARNING_EMITTED:
        return
    _PROXY_WARNING_EMITTED = True

    proxy_url = settings.effective_scraper_proxy
    if proxy_url:
        logger.info("Playwright — proxy résidentiel configuré (headless=True, HTTPS errors ignorés)")
    else:
        if settings.scraper_proxy_url.strip():
            logger.warning(
                "SCRAPER_PROXY_URL placeholder ou invalide — proxy ignoré"
            )
        logger.warning(
            "⚠️ Aucun proxy résidentiel configuré. Risque élevé de CAPTCHA sur Amazon/eBay. "
            "Les produits de marque seront mis en quarantaine (comportement attendu du Garde-fou 0)."
        )
        logger.info("Playwright — mode dev local (headless=False, délais aléatoires 2-5s)")


def _resolve_user_agent() -> str:
    try:
        from fake_useragent import UserAgent

        return UserAgent(browsers=["chrome", "firefox", "edge"]).random
    except Exception:
        from scraper.anti_ban import random_user_agent

        return random_user_agent()


def _playwright_launch_options() -> dict[str, Any]:
    proxy_url = settings.effective_scraper_proxy
    headless = True if proxy_url else False
    opts: dict[str, Any] = {"headless": headless}

    if proxy_url:
        opts["proxy"] = {"server": proxy_url}
        logger.info("Playwright — proxy actif: %s…", proxy_url[:40])
    return opts


def _context_options() -> dict[str, Any]:
    proxy_url = settings.effective_scraper_proxy
    opts: dict[str, Any] = {
        "user_agent": _resolve_user_agent(),
        "locale": "fr-FR",
        "viewport": {"width": 1366, "height": 768},
        "timezone_id": "Europe/Paris",
        "extra_http_headers": {
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        },
    }
    if proxy_url:
        opts["ignore_https_errors"] = True
    return opts


async def _apply_stealth(page) -> None:
    await page.add_init_script(STEALTH_INIT_SCRIPT)
    try:
        from playwright_stealth import stealth_async

        await stealth_async(page)
        logger.debug("playwright-stealth appliqué")
    except ImportError:
        logger.debug("playwright-stealth absent — scripts manuels uniquement")


def _detect_captcha(html: str) -> bool:
    return bool(CAPTCHA_PATTERNS.search(html))


async def _human_delay() -> None:
    from scraper.anti_ban import random_delay

    if settings.effective_scraper_proxy:
        await random_delay(1.0, 2.5)
    else:
        await random_delay(2.0, 5.0)


async def fetch_page_html(url: str, source: str) -> ScrapeResult:
    """
    Charge une page avec Playwright stealth, retries et détection CAPTCHA.
    N'élève pas d'exception — retourne ScrapeResult.
    """
    _log_proxy_status_once()

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.error("Playwright non installé — impossible de scraper %s", source)
        return ScrapeResult(success=False, error="Playwright non installé", source=source)

    last_error: str | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info("[%s] Tentative %d/%d — %s", source, attempt, MAX_RETRIES, url[:80])
            await _human_delay()

            async with async_playwright() as pw:
                browser = await pw.chromium.launch(**_playwright_launch_options())
                context = await browser.new_context(**_context_options())
                page = await context.new_page()
                await _apply_stealth(page)

                try:
                    response = await asyncio.wait_for(
                        page.goto(url, wait_until="domcontentloaded"),
                        timeout=SCRAPE_TIMEOUT_S,
                    )
                    html = await page.content()
                    status = response.status if response else 0

                    if _detect_captcha(html):
                        last_error = "CAPTCHA détecté"
                        logger.warning("[%s] CAPTCHA détecté (tentative %d)", source, attempt)
                        await browser.close()
                        if attempt < MAX_RETRIES:
                            logger.warning("[%s] Retry après CAPTCHA...", source)
                            await asyncio.sleep(3 * attempt)
                            continue
                        return ScrapeResult(
                            success=False,
                            error=last_error,
                            source=source,
                            attempt=attempt,
                            captcha_detected=True,
                        )

                    if status >= 400:
                        last_error = f"HTTP {status}"
                        logger.warning("[%s] HTTP %d (tentative %d)", source, status, attempt)
                        await browser.close()
                        if attempt < MAX_RETRIES:
                            continue
                        return ScrapeResult(success=False, error=last_error, source=source, attempt=attempt)

                    logger.info("[%s] Succès — %d octets HTML", source, len(html))
                    await browser.close()
                    return ScrapeResult(success=True, html=html, source=source, attempt=attempt)

                except asyncio.TimeoutError:
                    last_error = f"Timeout (> {SCRAPE_TIMEOUT_S}s)"
                    logger.error("[%s] Timeout (tentative %d)", source, attempt)
                    await browser.close()
                    if attempt < MAX_RETRIES:
                        logger.warning("[%s] Retry après timeout...", source)
                        continue

                except Exception as exc:
                    last_error = str(exc)
                    logger.error("[%s] Erreur Playwright (tentative %d): %s", source, attempt, exc)
                    try:
                        await browser.close()
                    except Exception:
                        pass
                    if attempt < MAX_RETRIES:
                        logger.warning("[%s] Retry...", source)
                        await asyncio.sleep(2 * attempt)
                        continue

        except Exception as exc:
            last_error = str(exc)
            logger.error("[%s] Échec lancement browser (tentative %d): %s", source, attempt, exc)
            if attempt < MAX_RETRIES:
                await asyncio.sleep(2 * attempt)
                continue

    return ScrapeResult(
        success=False,
        error=last_error or "Échec inconnu",
        source=source,
        attempt=MAX_RETRIES,
    )
