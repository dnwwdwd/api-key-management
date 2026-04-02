#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
DIST_DIR="$ROOT_DIR/dist"
SEED_WORK_DIR="$ROOT_DIR/.lpk-seed"
SEED_DB="$SEED_WORK_DIR/app.db"

rm -rf "$DIST_DIR" "$SEED_WORK_DIR"
mkdir -p "$DIST_DIR/.next" "$DIST_DIR/lzc" "$DIST_DIR/seed" "$SEED_WORK_DIR"

npm run build

DATABASE_FILE="$SEED_DB" npm run db:migrate
DATABASE_FILE="$SEED_DB" SEED_ADMIN_USERNAME="admin" SEED_ADMIN_PASSWORD="admin123456" npm run db:seed

cp "$SEED_DB" "$DIST_DIR/seed/app.db"
cp -R "$ROOT_DIR/.next/standalone/." "$DIST_DIR/"
cp -R "$ROOT_DIR/.next/static" "$DIST_DIR/.next/static"

if [ -d "$ROOT_DIR/public" ]; then
  cp -R "$ROOT_DIR/public" "$DIST_DIR/public"
fi

cp "$ROOT_DIR/lzc/run.sh" "$DIST_DIR/lzc/run.sh"
chmod +x "$DIST_DIR/lzc/run.sh"

rm -rf "$SEED_WORK_DIR"
