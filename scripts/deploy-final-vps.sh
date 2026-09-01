#!/usr/bin/env bash
# NEXUS-DROP — Déploiement final VPS (pull, .env, docker, ufw, tests)
set -euo pipefail

VPS_IP="${VPS_IP:-51.254.135.158}"
APP_DIR="/var/www/nexus-drop"
cd "$APP_DIR"

echo "=== PHASE 2 : git pull ==="
git fetch origin
git reset --hard origin/main

echo "=== PHASE 3 : .env production ==="
cat > .env << EOF
ENVIRONMENT=production
POSTGRES_USER=nexus
POSTGRES_PASSWORD=UnMotDePasseFort2026!
POSTGRES_DB=nexus_drop
DATABASE_URL=postgresql+asyncpg://nexus:UnMotDePasseFort2026!@db:5432/nexus_drop
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0

JWT_SECRET=changez-moi-longue-chaine-aleatoire-32chars-minimum
ADMIN_EMAIL=admin@nexus-drop.local
ADMIN_PASSWORD=VotreMotDePasseAdmin2026!

OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3

BACKEND_CORS_ORIGINS=http://${VPS_IP}:8080,http://localhost:3001
NEXT_PUBLIC_API_URL=http://${VPS_IP}:8080
NEXT_PUBLIC_STORE_URL=http://${VPS_IP}:8080

STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI
STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_ICI
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_ICI
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK_ICI

SCRAPER_PROXY_URL=
AUTO_PUBLISH_CRON_SCHEDULE=0 */6 * * *
AUTO_PUBLISH_MAX_PRODUCTS=10
EOF

echo "=== PHASE 4 : docker compose rebuild ==="
docker compose down 2>/dev/null || true
docker compose up -d --build

echo ">> Attente démarrage (30s)..."
sleep 30

echo "=== PHASE 4b : UFW ==="
chmod +x scripts/setup-ufw.sh
./scripts/setup-ufw.sh || echo "WARN: UFW — exécuter manuellement si échec"

echo "=== PHASE 5 : validation ==="
docker compose ps

FRONT=$(curl -sf -o /dev/null -w '%{http_code}' http://localhost:8080/ || echo "000")
echo "Frontend HTTP: $FRONT"

HEALTH=$(curl -sf http://localhost:8080/health || echo "FAIL")
echo "Health: $HEALTH"

SWAGGER=$(curl -sf -o /dev/null -w '%{http_code}' http://localhost:8080/docs || echo "000")
echo "Swagger HTTP: $SWAGGER"

ss -tlnp 2>/dev/null | grep -E '5433|6379|8000' || echo "✅ Ports sensibles fermés"

echo ""
echo "============================================"
echo "  Boutique : http://${VPS_IP}:8080"
echo "  Admin    : http://${VPS_IP}:8080/admin/login"
echo "  Webhook Stripe à configurer :"
echo "  http://${VPS_IP}:8080/webhooks/stripe"
echo "  Événement : payment_intent.succeeded"
echo "============================================"
echo ""
echo "⚠️  Remplacez les clés Stripe dans .env puis :"
echo "    nano .env && docker compose up -d --build frontend backend"
