# NEXUS-DROP — Checklist déploiement production (VPS)

## Prérequis serveur

- Ubuntu 22.04+ ou Debian 12+
- Docker Engine + Docker Compose v2
- Git
- Nom de domaine pointant vers le VPS (optionnel mais recommandé)
- 4 Go RAM minimum (8 Go recommandé avec Ollama)

---

## 1. Cloner et configurer le projet

```bash
git clone <votre-repo> nexus-drop
cd nexus-drop
cp .env.example .env
nano .env
```

Variables **obligatoires** en production :

| Variable | Exemple |
|----------|---------|
| `POSTGRES_PASSWORD` | mot de passe fort |
| `JWT_SECRET` | chaîne aléatoire longue |
| `ADMIN_PASSWORD` | mot de passe admin fort |
| `DATABASE_URL` | géré par docker-compose (PostgreSQL) |
| `REDIS_URL` | `redis://redis:6379/0` |
| `BACKEND_CORS_ORIGINS` | `https://votre-domaine.com` |
| `NEXT_PUBLIC_API_URL` | `https://api.votre-domaine.com` |

Variables **recommandées** :

| Variable | Description |
|----------|-------------|
| `SCRAPER_PROXY_URL` | Proxy résidentiel (Bright Data, Oxylabs, etc.) |
| `OLLAMA_URL` | `http://host.docker.internal:11434` si Ollama sur le host |
| `OLLAMA_MODEL` | `llama3` |
| `AUTO_PUBLISH_CRON_SCHEDULE` | `0 */6 * * *` |
| `AUTO_PUBLISH_MAX_PRODUCTS` | `10` |

---

## 2. Installer Ollama sur le VPS (IA réelle)

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3
ollama serve &
```

Vérification :

```bash
curl http://localhost:11434/api/tags
```

Dans `.env` :

```env
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3
```

---

## 3. Configurer le proxy scraper (production)

Sans proxy, Amazon/eBay renverront des CAPTCHA → quarantaine marques (Garde-fou 0).

```env
SCRAPER_PROXY_URL=http://user:pass@votre-proxy-residentiel.com:port
```

---

## 4. Déployer avec Docker Compose

```bash
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

Services démarrés :

- `db` — PostgreSQL
- `redis` — broker Celery
- `backend` — API FastAPI :8000
- `celery-worker` — pipeline auto-publish
- `celery-beat` — scheduler 6h
- `frontend` — Next.js
- `nginx` — reverse proxy :8080

---

## 5. Nginx + domaine + SSL (Certbot)

Exemple `/etc/nginx/sites-available/nexus-drop` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

SSL :

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

---

## 6. Vérifications post-déploiement

```bash
# API
curl http://localhost:8000/health

# Celery worker actif
docker compose logs celery-worker --tail=50

# Celery beat planifié
docker compose logs celery-beat --tail=20

# Admin
# https://votre-domaine.com/admin/login
```

---

## 7. Activer l'automation

1. Connexion admin
2. http://votre-domaine.com/admin/auto-publish
3. Toggle **Automatisation ON**
4. Vérifier qu'un cycle manuel fonctionne avant de laisser Beat tourner

---

## 8. Sauvegardes

- `./data/postgres` — volume PostgreSQL
- `./data/media` — images produits
- `.env` — **ne jamais committer**

```bash
tar czf nexus-backup-$(date +%F).tar.gz data/postgres data/media .env
```

---

## Dépannage rapide

| Problème | Solution |
|----------|----------|
| CAPTCHA scraping | Configurer `SCRAPER_PROXY_URL` |
| Listing fallback AIDA | Démarrer Ollama + `ollama pull llama3` |
| Celery ne traite rien | Vérifier Redis + logs `celery-worker` |
| Beat ignore les runs | Toggle `auto_publish_enabled` ON en admin |
| Garde-fou 0 quarantaine | Normal sans proxy pour produits de marque |
