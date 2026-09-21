#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_FILE="${1:-$ROOT_DIR/sis_phs11062026.sql}"
APP_CONTAINER="${APP_CONTAINER:-sis-phs-backend}"
MYSQL_CONTAINER="${MYSQL_CONTAINER:-sis-phs-mysql-backend}"
DB_NAME="${DB_NAME:-sis_phs}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file tidak ditemukan: $BACKUP_FILE" >&2
  exit 1
fi

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) dibutuhkan untuk membaca backup SQL." >&2
  exit 1
fi

extract_insert_blocks() {
  local table="$1"
  awk -v table="$table" '
    index($0, "INSERT INTO `" table "`") { capture = 1 }
    capture { print }
    capture && /;[[:space:]]*$/ { capture = 0 }
  ' "$BACKUP_FILE"
}

echo "[1/4] Menjalankan migration backend..."
docker exec "$APP_CONTAINER" php artisan migrate --force --no-interaction

echo "[2/4] Mengimpor tabel backup yang aman dan masih relevan..."
{
  cat <<SQL
USE \`${DB_NAME}\`;
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE trx_survey_answers;
TRUNCATE TABLE trx_surveys;
TRUNCATE TABLE mstr_respondents;
TRUNCATE TABLE mstr_households;
TRUNCATE TABLE mstr_yearly_question_items;
TRUNCATE TABLE mstr_yearly_questionnaires;
TRUNCATE TABLE mstr_question_options;
TRUNCATE TABLE mstr_questions;
TRUNCATE TABLE mstr_yearly_targets;
TRUNCATE TABLE mstr_periods;
TRUNCATE TABLE reg_villages;
TRUNCATE TABLE reg_districts;
TRUNCATE TABLE reg_regencies;
TRUNCATE TABLE reg_provinces;
SQL

  extract_insert_blocks "reg_provinces"
  extract_insert_blocks "reg_regencies"
  extract_insert_blocks "reg_districts"
  extract_insert_blocks "reg_villages"
  extract_insert_blocks "mstr_periods"
  extract_insert_blocks "mstr_questions"
  extract_insert_blocks "mstr_question_options"
  extract_insert_blocks "mstr_yearly_questionnaires"
  extract_insert_blocks "mstr_yearly_question_items"
  extract_insert_blocks "mstr_yearly_targets"
  extract_insert_blocks "mstr_households"
  extract_insert_blocks "mstr_respondents"
  extract_insert_blocks "trx_surveys"
  extract_insert_blocks "trx_survey_answers"

  echo "SET FOREIGN_KEY_CHECKS=1;"
} | docker exec -i "$MYSQL_CONTAINER" mysql -uroot -proot "$DB_NAME"

echo "[3/4] Menghitung hasil merge..."
docker exec "$MYSQL_CONTAINER" mysql -uroot -proot -e "
USE \`${DB_NAME}\`;
SELECT 'reg_provinces' AS table_name, COUNT(*) AS total FROM reg_provinces
UNION ALL
SELECT 'reg_regencies', COUNT(*) FROM reg_regencies
UNION ALL
SELECT 'reg_districts', COUNT(*) FROM reg_districts
UNION ALL
SELECT 'reg_villages', COUNT(*) FROM reg_villages
UNION ALL
SELECT 'mstr_periods', COUNT(*) FROM mstr_periods
UNION ALL
SELECT 'mstr_yearly_targets', COUNT(*) FROM mstr_yearly_targets;
"

echo "[4/4] Selesai."
echo "Catatan: script ini tidak lagi membuat tabel duplikat kompatibilitas seperti 'districts' dan 'villages'."
