#!/usr/bin/env bash
# Deploy / update ChallanOne on the VPS
# Run as challanone user:
#   cd /var/www/challanone && bash deploy/deploy.sh

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

API_URL="${VITE_API_URL:-https://api.challanone.com}"

echo "==> Pull latest code"
git pull --ff-only origin main

echo "==> Backend install"
cd "$APP_DIR/server"
npm install --omit=dev
npx playwright install chromium firefox
# System packages need root. Do NOT run install-deps as challanone (sudo password fails).
# As root once: cd /var/www/challanone/server && npx playwright install-deps
if [ "$(id -u)" -eq 0 ]; then
  npx playwright install-deps chromium firefox || true
else
  echo "==> Skipping playwright install-deps (run as root if browsers fail to launch)"
fi

if [ ! -f .env ]; then
  echo "ERROR: server/.env is missing. Create it before deploying."
  exit 1
fi

echo "==> Restart API (PM2)"
cd "$APP_DIR/server"
# Stop crash loops from leftover node processes holding PORT
PORT_TO_FREE="${PORT:-5000}"
# Remove legacy/duplicate PM2 apps that would fight for the API port
# (PM2 respawns them after a plain kill, so they must be deleted by name)
for APP_NAME in challanone-api challano; do
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
  fi
done
# Kill anything still bound to the API port (orphans from previous crash loops)
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT_TO_FREE}/tcp" >/dev/null 2>&1 || true
elif command -v lsof >/dev/null 2>&1; then
  lsof -ti ":${PORT_TO_FREE}" | xargs -r kill -9 >/dev/null 2>&1 || true
fi
sleep 1
pm2 start server.js --name challanone-api --cwd "$APP_DIR/server" --update-env
pm2 save

echo "==> Build customer app"
cd "$APP_DIR/client"
echo "VITE_API_URL=$API_URL" > .env.production
npm install
npm run build

echo "==> Build admin app"
cd "$APP_DIR/admin"
echo "VITE_API_URL=$API_URL" > .env.production
npm install
npm run build

echo "==> Allow nginx to read built files"
chmod 755 "$APP_DIR" "$APP_DIR/client" "$APP_DIR/admin" || true
chmod -R a+rX "$APP_DIR/client/dist" "$APP_DIR/admin/dist" || true

echo "==> Health check"
sleep 1
curl -fsS "http://127.0.0.1:5000/api/health" || {
  echo "API health check failed"
  pm2 logs challanone-api --lines 50
  exit 1
}

echo ""
echo "Deploy complete."
echo "API:    $API_URL"
echo "App:    https://challanone.com"
echo "Admin:  https://admin.challanone.com"
