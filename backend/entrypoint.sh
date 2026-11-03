#!/bin/sh
set -e

echo "==> Waiting for PostgreSQL database to be reachable..."
if [ "$DB_HOST" != "" ]; then
    while ! python -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.connect(('$DB_HOST', int('$DB_PORT')))" 2>/dev/null; do
        echo "Database is unavailable - sleeping 1s"
        sleep 1
    done
    echo "==> PostgreSQL is ready and accepting connections!"
fi

echo "==> Running Django database migrations..."
python manage.py makemigrations menu tables orders --noinput || true
python manage.py migrate --noinput

echo "==> Seeding initial categories, tables, and dishes..."
python manage.py loaddata initial_seed.json 2>/dev/null || echo "Seed data already loaded or skipped."

echo "==> Creating staff accounts from environment variables..."
python manage.py create_staff 2>/dev/null || echo "Staff account creation skipped."

echo "==> Starting BhojanQR Django server on 0.0.0.0:8000..."
exec "$@"
