#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/coreskils/app"
cd "$APP_DIR"

# Prevent two timer runs from deploying at the same time.
exec 9>/run/lock/coreskils-deploy.lock
flock -n 9 || exit 0

git -c safe.directory="$APP_DIR" fetch origin main
LOCAL_HEAD="$(git -c safe.directory="$APP_DIR" rev-parse HEAD)"
REMOTE_HEAD="$(git -c safe.directory="$APP_DIR" rev-parse origin/main)"

if [[ "$LOCAL_HEAD" == "$REMOTE_HEAD" && "${1:-}" != "--force" ]]; then
  echo "Already up to date: ${LOCAL_HEAD:0:8}"
  exit 0
fi

git -c safe.directory="$APP_DIR" checkout main
git -c safe.directory="$APP_DIR" pull --ff-only origin main

corepack enable
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
pnpm install --frozen-lockfile
pnpm run typecheck

set -a
# shellcheck disable=SC1091
source /etc/coreskils/api.env
set +a

pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run build
PORT=24567 BASE_PATH=/ pnpm --filter @workspace/lms-front run build

systemctl restart coreskils-api
install -m 644 deploy/vps/coreskils.com.nginx /etc/nginx/sites-available/coreskils.com
nginx -t
systemctl reload nginx

curl --fail --silent --show-error http://127.0.0.1:4000/api/healthz
echo
echo "Deployment completed successfully: ${REMOTE_HEAD:0:8}"