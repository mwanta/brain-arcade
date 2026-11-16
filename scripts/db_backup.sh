#!/usr/bin/env bash
# Dump the current database to backend/database/backups/<db>_<timestamp>.sql
set -euo pipefail
source "$(dirname "$0")/_db_env.sh"

OUT="$ROOT_DIR/backend/database/backups/${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
"$MYSQLDUMP" "${MYSQL_ARGS[@]}" --routines --triggers --set-gtid-purged=OFF "$DB_NAME" > "$OUT"
echo "Backup written to $OUT"
