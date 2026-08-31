# NEXUS-DROP Scraper / Worker

Worker Celery pour la détection de tendances, le fulfillment fournisseur et la génération de badges produit.

## Stack

- **Celery** + **Redis** (broker)
- **httpx** + **BeautifulSoup4** pour le scraping HTTP (sans navigateur Playwright)
- **Pillow** pour les badges image
- **SQLAlchemy** / **asyncpg** (prêts pour accès PostgreSQL futur)

## Démarrage local

```bash
pip install -r requirements.txt
export REDIS_URL=redis://localhost:6379/0
python worker.py
```

## Démarrage Docker

Le service `worker` est défini dans `docker-compose.yml` à la racine du projet.

```bash
docker compose up worker
```

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `REDIS_URL` | `redis://localhost:6379/0` | Broker Redis |
| `CELERY_BROKER_URL` | *(fallback `REDIS_URL`)* | URL broker Celery |
| `BACKEND_URL` | `http://backend:8000` | API backend pour `/trends/bulk` |
| `MEDIA_DIR` | `/app/media` | Sortie des images badgées |

## Tâches

| Tâche | Description |
|-------|-------------|
| `tasks.scan_trends_fr` | Données demo FR (Amazon, Cdiscount, Temu, TikTok Shop) → POST `/trends/bulk` |
| `tasks.fulfill_order` | Achat fournisseur simulé + numéro de suivi |
| `tasks.generate_badge_image` | Badge Pillow sur la première image produit |

## Exemple d'appel

```python
from tasks import scan_trends_fr, fulfill_order, generate_badge_image

scan_trends_fr.delay()
fulfill_order.delay("order-123", supplier="ali_mock", product_sku="SKU-001")
generate_badge_image.delay("/app/media/product.jpg", badge_label="TOP VENTE")
```
