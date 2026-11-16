# Shared helper: loads DB credentials from backend/.env and builds mysql args.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE (copy backend/.env.example and fill in your MySQL credentials)" >&2
  exit 1
fi
set -a; source "$ENV_FILE"; set +a

# Prefer mysql on PATH, fall back to the default macOS installer location.
MYSQL_BIN_DIR="$(dirname "$(command -v mysql 2>/dev/null || echo /usr/local/mysql/bin/mysql)")"
MYSQL="$MYSQL_BIN_DIR/mysql"
MYSQLDUMP="$MYSQL_BIN_DIR/mysqldump"

export MYSQL_PWD="$DB_PASSWORD"   # avoids putting the password on the command line
MYSQL_ARGS=(-h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER")
