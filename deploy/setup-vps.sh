#!/usr/bin/env bash
# First-time VPS setup for ChallanOne (Ubuntu)
# Run as root: bash setup-vps.sh

set -euo pipefail

APP_DIR="/var/www/challanone"
APP_USER="challanone"
REPO="https://github.com/MohitShishodia/ChallanOne.git"
# Prefer SSH if you add a deploy key:
# REPO="git@github.com:MohitShishodia/ChallanOne.git"

echo "==> Updating system"
apt update && apt upgrade -y
apt install -y curl git nginx ufw build-essential ca-certificates

echo "==> Installing Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
node -v
npm -v

echo "==> Installing PM2"
npm install -g pm2

echo "==> Firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> App user + directory"
if ! id "$APP_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$APP_USER"
fi
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo "==> Clone repo (if empty)"
if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git clone "$REPO" "$APP_DIR"
else
  echo "Repo already present at $APP_DIR"
fi

echo "==> Playwright system deps"
cd "$APP_DIR/server"
npx --yes playwright install-deps chromium || true

echo ""
echo "Setup base complete."
echo "Next:"
echo "  1) Create $APP_DIR/server/.env"
echo "  2) Copy nginx configs from deploy/nginx/"
echo "  3) Run: sudo -u $APP_USER bash $APP_DIR/deploy/deploy.sh"
echo "  4) Point DNS A records to this VPS IP"
echo "  5) Run certbot for SSL"
