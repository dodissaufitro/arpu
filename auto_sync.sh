#!/bin/bash

# ==============================================================================
# Script Otomatisasi Harian ARPU (Daily Push Fetch)
# ==============================================================================

CONTAINER_ID="8f31c8f9acf8"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Memulai otomatisasi Sinkronisasi ARPU..."

# Deteksi apakah berjalan via Docker di server produksi atau Native PHP
if command -v docker >/dev/null 2>&1 && docker ps -q 2>/dev/null | grep -q "$CONTAINER_ID"; then
    echo "Menjalankan via Docker Container: $CONTAINER_ID"
    docker exec "$CONTAINER_ID" php -d memory_limit=2048M /app/artisan arpu:fetch
else
    echo "Menjalankan via PHP Host"
    php -d memory_limit=2048M artisan arpu:fetch
fi

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Otomatisasi selesai dengan sukses."
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Peringatan: Proses selesai dengan exit code $EXIT_CODE"
fi
