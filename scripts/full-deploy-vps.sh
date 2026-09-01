#!/usr/bin/env bash
# NEXUS-DROP — Déploiement complet VPS (clone, Docker, .env, compose, Ollama)
set -euo pipefail

VPS_IP="${VPS_IP:-51.254.135.158}"
APP_DIR="/var/www/nexus-drop"
REPO="https://github.com/urdirditfurd/nexus-drop.git"
ADMIN_PASS="${ADMIN_PASS:-VotreMotDePasseAdmin2026!}"
JWT_SECRET="${JWT_SECRET:-nexus-drop-jwt-$(openssl rand -hex 24 2>/dev/null || date +%s)}"
PG_PASS="${PG_PASS:-NexusPg$(openssl rand -hex 12 2>/dev/null || date +%s)}"

echo "=== NEXUS-DROP full deploy ==="

# --- Docker ---
if ! command -v docker >/dev/null 2>&1; then
  echo ">> Installation Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# --- Dossier propre ---
if [ -d "$APP_DIR/.git" ]; then
  echo ">> Mise à jour repo existant"
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/main
else
  echo ">> Clone frais dans $APP_DIR"
  rm -rf "${APP_DIR}.bak" 2>/dev/null || true
  if [ -d "$APP_DIR" ] && [ "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
    mv "$APP_DIR" "${APP_DIR}.bak.$(date +%s)"
  fi
  mkdir -p "$APP_DIR"
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# --- .env production ---
if [ ! -f .env ]; then
  cp .env.example .env
fi

# Mise à jour des variables critiques (sed in-place)
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${PG_PASS}|" .env
sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql+asyncpg://nexus:${PG_PASS}@db:5432/nexus_drop|" .env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=${ADMIN_PASS}|" .env
sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://${VPS_IP}:8000|" .env
sed -i "s|^NEXT_PUBLIC_STORE_URL=.*|NEXT_PUBLIC_STORE_URL=http://${VPS_IP}:8080|" .env
sed -i "s|^BACKEND_CORS_ORIGINS=.*|BACKEND_CORS_ORIGINS=http://${VPS_IP}:8080,http://${VPS_IP}:3000,http://${VPS_IP}:8000|" .env
sed -i "s|^OLLAMA_URL=.*|OLLAMA_URL=http://host.docker.internal:11434|" .env

grep -q "^OLLAMA_MODEL=" .env || echo "OLLAMA_MODEL=llama3" >> .env
grep -q "^AUTO_PUBLISH_CRON_SCHEDULE=" .env || echo "AUTO_PUBLISH_CRON_SCHEDULE=0 */6 * * *" >> .env
grep -q "^AUTO_PUBLISH_MAX_PRODUCTS=" .env || echo "AUTO_PUBLISH_MAX_PRODUCTS=10" >> .env

echo ">> .env configuré (ADMIN: admin@nexus-drop.local / ${ADMIN_PASS})"

# --- Ollama (host) ---
if ! command -v ollama >/dev/null 2>&1; then
  echo ">> Installation Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
fi
if systemctl is-active ollama >/dev/null 2>&1 || pgrep -x ollama >/dev/null 2>&1; then
  echo ">> Ollama déjà actif"
else
  echo ">> Démarrage Ollama..."
  (ollama serve >/var/log/ollama.log 2>&1 &) || true
  sleep 3
fi
if ! ollama list 2>/dev/null | grep -q llama3; then
  echo ">> Téléchargement modèle llama3 (peut prendre plusieurs minutes)..."
  ollama pull llama3 || echo "WARN: ollama pull llama3 échoué — listing utilisera fallback AIDA"
fi

# --- Conflit port 8000 (EBX ou autre) ---
if ss -tlnp 2>/dev/null | grep -q ':8000 '; then
  echo "WARN: Port 8000 déjà utilisé. Arrêt des conteneurs nexus-drop existants..."
  docker compose down 2>/dev/null || true
fi

# --- Build & run ---
echo ">> docker compose up -d --build (10-15 min la 1ère fois)..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo ">> Attente démarrage (30s)..."
sleep 30

echo ">> Statut conteneurs:"
docker compose ps

echo ">> Test santé API:"
curl -sf "http://localhost:8000/health" && echo || echo "WARN: /health non OK — vérifiez: docker compose logs backend --tail=40"

echo ">> Test nginx (8080):"
curl -sf -o /dev/null -w "HTTP %{http_code}\n" "http://localhost:8080/" || echo "WARN: nginx 8080 non OK"

echo ""
echo "=== DÉPLOIEMENT TERMINÉ ==="
echo "  Boutique/Admin : http://${VPS_IP}:8080"
echo "  Admin login    : http://${VPS_IP}:8080/admin/login"
echo "  API docs       : http://${VPS_IP}:8000/docs"
echo "  Email/Pass     : admin@nexus-drop.local / ${ADMIN_PASS}"
echo "  Logs worker    : docker compose -f ${APP_DIR}/docker-compose.yml logs celery-worker --tail=50"
