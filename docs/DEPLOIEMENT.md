# Déploiement NEXUS-DROP sur VPS OVH

## Prérequis
- Accès SSH : `ssh root@51.254.135.158` (clé privée configurée)
- Domaine pointant vers le VPS (pour Let's Encrypt)
- EBX existant sur `/var/www/ebx` — **ne pas supprimer**

## 1. Copier le projet

```powershell
cd "c:\Users\conta\OneDrive\Documents\dropshipping international\nexus-drop"
scp -r . root@51.254.135.158:/var/www/nexus-drop
```

## 2. Bootstrap Docker (1×)

```bash
ssh root@51.254.135.158 "bash /var/www/nexus-drop/scripts/bootstrap-vps.sh"
```

## 3. Configurer `.env`

```bash
ssh root@51.254.135.158
cd /var/www/nexus-drop
cp .env.example .env
nano .env   # mots de passe, JWT_SECRET, Stripe test keys
```

## 4. Lancer

```bash
docker compose up -d --build
docker compose ps
```

## Ports

| Port | Service |
|------|---------|
| 8080 | Nginx (boutique + /api) |
| 3000 | Next.js direct |
| 8000 | FastAPI docs |

## HTTPS (Certbot)

```bash
apt install certbot python3-certbot-nginx
# Adapter nginx pour ton domaine puis :
certbot --nginx -d boutique.tondomaine.fr
```

## Admin par défaut
- Email : `admin@nexus-drop.local`
- Mot de passe : voir `.env` (`ADMIN_PASSWORD`)
