#!/usr/bin/env bash
# Bootstrap VPS Ubuntu pour NEXUS-DROP (ne touche pas /var/www/ebx)
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release git ufw

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

mkdir -p /var/www/nexus-drop
echo "[OK] Docker prêt. Déploie le monorepo dans /var/www/nexus-drop puis: docker compose up -d --build"
echo "[NOTE] Ports NEXUS: 8080 (nginx), 8000 (api), 3000 (next). EBX reste sur 3000 si déjà bindé — arrête ou change les ports."
