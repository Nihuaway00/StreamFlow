FROM alfg/nginx-rtmp:latest

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Копируем плеер
COPY player.html /usr/share/nginx/html/player.html

# Создаем директорию для HLS
RUN mkdir -p /tmp/hls

EXPOSE 1935 8080

CMD ["nginx", "-g", "daemon off;"]