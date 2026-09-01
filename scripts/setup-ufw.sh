#!/usr/bin/env bash
# NEXUS-DROP — Règles firewall UFW (VPS Ubuntu)
set -euo pipefail

echo "=== Configuration UFW NEXUS-DROP ==="

ufw --force reset
ufw default deny incoming
ufw default allow outgoing

ufw allow 22/tcp comment "SSH"
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
ufw allow 8080/tcp comment "NEXUS-DROP Nginx"

# Bloquer accès public DB/Redis/API directe
ufw deny 5433/tcp comment "PostgreSQL"
ufw deny 6379/tcp comment "Redis"
ufw deny 8000/tcp comment "Backend direct"
ufw deny 8001/tcp comment "Backend direct alt"

ufw --force enable
ufw status verbose

echo "[OK] Firewall configuré — seuls 22, 80, 443, 8080 sont ouverts."
