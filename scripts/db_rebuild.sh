#!/usr/bin/env bash
# Rebuild the database from scratch.
#   ./scripts/db_rebuild.sh                 -> schema.sql + seed.sql
#   ./scripts/db_rebuild.sh <backup.sql>    -> restore a mysqldump backup
set -euo pipefail
source "$(dirname "$0")/_db_env.sh"

if [[ $# -ge 1 ]]; then
  echo "Restoring $DB_NAME from $1 ..."
  "$MYSQL" "${MYSQL_ARGS[@]}" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\`;"
  "$MYSQL" "${MYSQL_ARGS[@]}" "$DB_NAME" < "$1"
else
  echo "Rebuilding $DB_NAME from schema.sql + seed.sql ..."
  "$MYSQL" "${MYSQL_ARGS[@]}" < "$ROOT_DIR/backend/database/schema.sql"
  "$MYSQL" "${MYSQL_ARGS[@]}" < "$ROOT_DIR/backend/database/seed.sql"
fi
echo "Done."
