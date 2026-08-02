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
npx playwright install chromium

if [ ! -f .env ]; then
  echo "ERROR: server/.env is missing. Create it before deploying."
  exit 1
fi

echo "==> Restart API (PM2)"
if pm2 describe challanone-api >/dev/null 2>&1; then
  pm2 restart challanone-api --update-env
else
  pm2 start server.js --name challanone-api
fi
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
