FROM alfg/nginx-rtmp:latest

# Копируем конфигурацию
COPY nginx.conf /etc/nginx/nginx.conf

# Создаем директорию для HLS
RUN mkdir -p /tmp/hls

EXPOSE 1935 8080

CMD ["nginx", "-g", "daemon off;"]