# NEXUS-DROP

Plateforme dropshipping multi-marchés : **boutique Shopify-like** + **admin cockpit** + Trend Radar + Supplier Sniper + IA listing + auto-orders.

## Démarrage local (Docker)

```powershell
cd "c:\Users\conta\OneDrive\Documents\dropshipping international\nexus-drop"
copy .env.example .env
docker compose up -d --build
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Boutique + Admin |
| http://localhost:8080 | Nginx (proxy /api) |
| http://localhost:8000/docs | API FastAPI |

**Admin** : `admin@nexus-drop.local` / `NexusAdmin2026!` (change dans `.env`)

## Sans Docker (dev rapide)

```powershell
# Terminal 1 — API
cd backend
pip install -r requirements.txt
$env:DATABASE_URL="sqlite+aiosqlite:///./nexus_drop.db"
python main.py

# Terminal 2 — Front
cd frontend
npm install
$env:NEXT_PUBLIC_API_URL="http://localhost:8000"
npm run dev
```

## Déploiement VPS (`51.254.135.158`)

```bash
git clone https://github.com/urdirditfurd/nexus-drop.git /var/www/nexus-drop
cd /var/www/nexus-drop
cp .env.example .env
nano .env
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

> EBX reste dans `/var/www/ebx`. NEXUS utilise le port **8080** (nginx) pour éviter le conflit avec EBX sur 3000.

## Modules

- **Trend Radar** — `POST /trends/scan` + worker Celery `scan_trends_fr`
- **Supplier Sniper** — CRUD fournisseurs + score marge
- **AI Listing** — `POST /ai/generate-listing` (Ollama ou fallback AIDA)
- **Storefront** — Home, PDP, checkout Stripe test
- **Auto-Orders** — `POST /orders/{id}/fulfill`
- **Garde-fous EBX** — VERO + anti-catastrophe prix à la publication

## Phases livrées

1. Monorepo + Docker Compose + Nginx  
2. FastAPI + PostgreSQL + JWT + seed démo  
3. Admin Shopify-like (sidebar, KPIs, radar, IA)  
4. Trend scan (demo + Celery)  
5. AI listing generator  
6. Storefront premium mobile-first  
7. Fulfillment worker stub  
8. Docs + `.env.example`
