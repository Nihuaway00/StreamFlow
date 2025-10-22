FROM alfg/nginx-rtmp:latest

# Копируем конфигурацию nginx
# Копируем ОБА конфига
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.dev.conf /etc/nginx/nginx.dev.conf

# Копируем плеер
COPY player.html /usr/share/nginx/html/player.html

# Создаем директорию для HLS
RUN mkdir -p /tmp/hls

EXPOSE 1935 8080

# По умолчанию обычный конфиг
CMD ["nginx", "-g", "daemon off;"]