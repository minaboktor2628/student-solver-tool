#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="main"
DO_BACKUP=true
BACKUP_DIR="/home/backups" # IT made it so backups here last 60 days

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  -b, --branch <name>   Git branch to deploy (default: main)
      --no-backup       Skip SQLite backup
  -h, --help            Show this help message

Examples:
  $(basename "$0")
  $(basename "$0") --branch dev
  $(basename "$0") -b staging --no-backup
EOF
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--branch)
      BRANCH="$2"
      shift 2
      ;;
    --no-backup)
      DO_BACKUP=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo
      usage
      exit 1
      ;;
  esac
done

cd "$APP_DIR"

echo "==> Deploying sts from branch: $BRANCH"
echo "==> Repo dir: $APP_DIR"
echo "==> Backup enabled: $DO_BACKUP"

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

if [[ "$DO_BACKUP" == true ]]; then
  echo "==> SQLite backup"
  ts="$(date +%Y%m%d-%H%M%S)"

  mkdir -p "$BACKUP_DIR"

  docker run --rm \
    -v sts_sqlite:/data \
    -v "$BACKUP_DIR:/backups" \
    alpine:3 sh -lc "cp -f /data/prod.db /backups/prod.db.$ts 2>/dev/null || true"

  echo "Backup saved to $BACKUP_DIR/prod.db.$ts"
else
  echo "==> Skipping SQLite backup"
fi

echo "==> Run DB migrations"
docker compose --profile migrate run --rm sts-migrate

echo "==> Start / update services"
docker compose up -d --remove-orphans

echo "==> Current status:"
docker compose ps

echo "==> Done."
