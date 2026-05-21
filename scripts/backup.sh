#!/usr/bin/env bash
# Nightly logical backup. Runs on the VPS host via cron, separate from the
# continuous Litestream replication. 30-day retention enforced upstream
# (rclone --max-age 30d).

set -euo pipefail

DB_PATH="${DATABASE_PATH:-/opt/onehouse/data/app.db}"
OUT_DIR="${BACKUP_DIR:-/opt/onehouse/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="${OUT_DIR}/app-${STAMP}.db"

mkdir -p "${OUT_DIR}"

# Atomic snapshot via VACUUM INTO.
docker compose exec -T app sqlite3 "${DB_PATH}" "VACUUM INTO '/data/_snapshot.db'"
mv "$(dirname "${DB_PATH}")/_snapshot.db" "${OUT_FILE}"
gzip --best "${OUT_FILE}"

echo "wrote ${OUT_FILE}.gz"
