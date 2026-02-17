#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-main}"
BACKUP_DIR="/home/backups" # IT made it so backups here last 60 days

cd "$APP_DIR"

echo "==> Deploying sts from branch: $BRANCH"
echo "==> Repo dir: $APP_DIR"

# Make sure docker compose is available
if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose not found. Install Docker + Compose plugin."
  exit 1
fi

echo "==> Fetch + reset to origin/$BRANCH"
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Build images"
docker compose build --pull

echo "==> SQLite backup"
ts="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

docker run --rm \
  -v sts_sqlite:/data \
  -v "$BACKUP_DIR:/backups" \
  alpine:3 sh -lc "cp -f /data/prod.db /backups/prod.db.$ts 2>/dev/null || true"

echo "Backup saved to $BACKUP_DIR/prod.db.$ts"

echo "==> Run DB migrations"
docker compose --profile migrate run --rm sts-migrate

echo "==> Start / update services"
docker compose up -d --remove-orphans

# echo "==> Waiting for sts to become healthy..."
# Poll health status (up to ~2 minutes)
# deadline=$((SECONDS + 120))
# while true; do
#   status="$(docker inspect --format='{{.State.Health.Status}}' "$(docker compose ps -q sts)" 2>/dev/null || true)"
#   if [[ "$status" == "healthy" ]]; then
#     echo "sts is healthy"
#     break
#   fi
#   if [[ "$status" == "unhealthy" ]]; then
#     echo "sts is unhealthy. Recent logs:"
#     docker compose logs --no-color --tail=200 sts
#     exit 1
#   fi
#   if (( SECONDS > deadline )); then
#     echo "Timed out waiting for healthcheck. Recent logs:"
#     docker compose logs --no-color --tail=200 sts
#     exit 1
#   fi
#   sleep 3
# done

echo "==> Current status:"
docker compose ps

echo "==> Done."

