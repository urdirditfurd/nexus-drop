"""Configuration centralisée via variables d'environnement."""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# Racine du backend (parent de app/)
BACKEND_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_ROOT.parent
MEDIA_DIR = BACKEND_ROOT / "media"
BACKEND_ENV_FILE = BACKEND_ROOT / ".env"
ROOT_ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Paramètres chargés depuis .env ou l'environnement."""

    model_config = SettingsConfigDict(
        env_file=(
            str(ROOT_ENV_FILE),
            str(BACKEND_ENV_FILE),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Base de données
    database_url: str = "sqlite+aiosqlite:///./nexus_drop.db"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str | None = None

    # Auth admin JWT
    admin_email: str = "admin@nexus-drop.local"
    admin_password: str = "NexusAdmin2026!"
    jwt_secret: str = "change-me-to-a-long-random-secret-nexus-drop"
    jwt_expire_minutes: int = 10080
    jwt_algorithm: str = "HS256"

    # CORS — liste séparée par des virgules
    backend_cors_origins: str = "http://localhost:3001,http://localhost:8080,http://127.0.0.1:3001"

    # Environnement (development | production)
    environment: str = "development"

    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""

    # Ollama pour génération IA
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"

    # Scraper furtif
    scraper_proxy_url: str = ""
    scraper_timeout_s: float = 30.0

    # Auto-publish scheduler (Celery Beat — pas de boucle rapide)
    auto_publish_cron_schedule: str = "0 */6 * * *"
    auto_publish_max_products: int = 10

    @property
    def cors_origins(self) -> list[str]:
        """Parse les origines CORS depuis la chaîne env."""
        return [o.strip() for o in self.backend_cors_origins.split(",") if o.strip()]

    @property
    def broker_url(self) -> str:
        """URL broker Celery (fallback sur REDIS_URL)."""
        return self.celery_broker_url or self.redis_url

    @property
    def is_sqlite(self) -> bool:
        """True si DATABASE_URL pointe vers SQLite (tests locaux)."""
        return "sqlite" in self.database_url.lower()

    @property
    def scraper_headless(self) -> bool:
        """
        Avec proxy → headless autorisé.
        Sans proxy → headless=False pour tests locaux furtifs.
        """
        return bool(self.effective_scraper_proxy)

    @property
    def is_production(self) -> bool:
        """True si ENVIRONMENT=production."""
        return self.environment.strip().lower() == "production"

    @property
    def effective_scraper_proxy(self) -> str:
        """Ignore les placeholders .env non configurés."""
        raw = self.scraper_proxy_url.strip()
        if not raw:
            return ""
        placeholder_markers = (
            "proxy.residentiel.com",
            "username:password",
            ":port",
        )
        if any(marker in raw for marker in placeholder_markers):
            return ""
        return raw


settings = Settings()
