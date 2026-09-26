#!/bin/sh
set -eu

php artisan storage:link --force || true
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
php artisan db:seed --force

exec apache2-foreground
