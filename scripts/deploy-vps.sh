#!/usr/bin/env bash
# NEXUS-DROP — Déploiement VPS (Docker Compose)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== NEXUS-DROP deploy VPS ==="

if [ ! -f ".env" ]; then
  echo "ERREUR: .env manquant. Copiez .env.example vers .env et configurez-le."
  exit 1
fi

echo ">> git pull origin main"
git pull origin main

echo ">> docker compose down"
docker compose down

echo ">> docker compose up -d --build"
docker compose up -d --build

echo ">> Attente santé des services (15s)..."
sleep 15

echo ">> Statut des conteneurs"
docker compose ps

echo ">> Logs celery-worker (Ctrl+C pour quitter)"
docker compose logs -f celery-worker
