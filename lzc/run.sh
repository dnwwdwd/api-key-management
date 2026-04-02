#!/usr/bin/env sh
set -eu

CONTENT_DIR="/lzcapp/pkg/content"
WORK_DIR="/lzcapp/cache/runtime"
DATA_DIR="/lzcapp/var/data"
DEFAULT_DB_PATH="$DATA_DIR/app.db"
SEED_DB="$CONTENT_DIR/seed/app.db"
CONTENT_BUILD_ID_FILE="$CONTENT_DIR/.next/BUILD_ID"
WORK_BUILD_ID_FILE="$WORK_DIR/.next/BUILD_ID"

export DATABASE_FILE="${DATABASE_FILE:-$DEFAULT_DB_PATH}"
export AUTH_SECRET="${AUTH_SECRET:-lazycat-auth-secret-change-me-please-32-bytes}"
export ENCRYPTION_KEY="${ENCRYPTION_KEY:-0123456789abcdef0123456789abcdef}"
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export SEED_ADMIN_USERNAME="${SEED_ADMIN_USERNAME:-admin}"
export SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-admin123456}"

mkdir -p "$(dirname "$DATABASE_FILE")"

if [ ! -f "$DATABASE_FILE" ] && [ -f "$SEED_DB" ]; then
  cp "$SEED_DB" "$DATABASE_FILE"
fi

NEED_SYNC="1"
if [ -f "$WORK_BUILD_ID_FILE" ] && [ -f "$CONTENT_BUILD_ID_FILE" ]; then
  if [ "$(cat "$WORK_BUILD_ID_FILE")" = "$(cat "$CONTENT_BUILD_ID_FILE")" ]; then
    NEED_SYNC="0"
  fi
fi

if [ "$NEED_SYNC" = "1" ]; then
  rm -rf "$WORK_DIR"
  mkdir -p "$WORK_DIR"
  cp -R "$CONTENT_DIR"/. "$WORK_DIR"/
fi

log() {
  printf '[run.sh] %s\n' "$*"
}

log "Starting standalone server"
exec node "$WORK_DIR/server.js"
