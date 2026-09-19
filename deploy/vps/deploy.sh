#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/coreskils/app"
cd "$APP_DIR"

git fetch origin main
git checkout main
git pull --ff-only origin main

corepack enable
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run build
PORT=24567 BASE_PATH=/ pnpm --filter @workspace/lms-front run build

sudo systemctl restart coreskils-api
sudo systemctl reload nginx

curl --fail --silent --show-error http://127.0.0.1:4000/api/healthz
echo
echo "Deployment completed successfully."