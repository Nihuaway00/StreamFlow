FROM alfg/nginx-rtmp:latest

# Копируем шаблон конфига
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Копируем и делаем исполняемым entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Копируем плеер
COPY player.html /usr/share/nginx/html/player.html

# Создаем директорию для HLS
RUN mkdir -p /tmp/hls

EXPOSE 1935 8080

ENTRYPOINT ["/entrypoint.sh"]