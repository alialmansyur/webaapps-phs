#!/bin/sh
set -eu

cd /var/www/html

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ ! -f vendor/autoload.php ]; then
  composer install --no-interaction --prefer-dist
fi

if [ "${DB_CONNECTION:-}" = "mysql" ] && [ "${WAIT_FOR_DB:-false}" = "true" ]; then
  echo "Waiting for MySQL at ${DB_HOST:-mysql}:${DB_PORT:-3306}..."
  until mysql \
    --protocol=TCP \
    -h"${DB_HOST:-mysql}" \
    -P"${DB_PORT:-3306}" \
    -u"${DB_USERNAME:-root}" \
    -p"${DB_PASSWORD:-}" \
    -e "SELECT 1" "${DB_DATABASE:-mysql}" >/dev/null 2>&1; do
    echo "MySQL not ready for app connection yet, retrying..."
    sleep 2
  done
  echo "MySQL app connection is ready."
fi

if ! grep -Eq '^APP_KEY=.+$' .env; then
  php artisan key:generate --force
fi

php artisan package:discover --ansi >/dev/null

php artisan serve --host=0.0.0.0 --port=8000
