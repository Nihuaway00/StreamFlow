#!/bin/sh
set -e

# Подставляем переменные в nginx.conf
envsubst '${BACKEND_HOST} ${BACKEND_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Запускаем nginx
exec nginx -g 'daemon off;'