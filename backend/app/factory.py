"""Factory FastAPI NEXUS-DROP."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import MEDIA_DIR, settings
from app.database import AsyncSessionLocal, Base, engine
from app.routers import (
    ai,
    auth,
    auto_publish,
    checkout,
    dashboard,
    health,
    listings,
    orders,
    products,
    settings as settings_router,
    storefront,
    suppliers,
    trends,
)
from app.services.migrate import ensure_product_columns
from app.services.seed import seed_database

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialisation DB + seed au démarrage."""
    # Création des tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await ensure_product_columns(engine)

    # Seed démo (admin, produits, tendances)
    async with AsyncSessionLocal() as session:
        await seed_database(session)

    logger.info("NEXUS-DROP backend prêt — DB=%s", settings.database_url[:40])
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    """Construit l'application FastAPI."""
    app = FastAPI(
        title="NEXUS-DROP API",
        description="Backend dropshipping — catalogue, tendances, IA listing, checkout.",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS depuis env
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Fichiers statiques media/
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

    # Routeurs
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(products.router)
    app.include_router(suppliers.router)
    app.include_router(trends.router)
    app.include_router(orders.router)
    app.include_router(settings_router.router)
    app.include_router(listings.router)
    app.include_router(dashboard.router)
    app.include_router(ai.router)
    app.include_router(auto_publish.router)
    app.include_router(checkout.router)
    app.include_router(storefront.router)

    return app
