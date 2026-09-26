#!/bin/bash

# ==============================================================================
# Script Sinkronisasi ARPU Berurutan (Sequential Date Range Fetch)
# ==============================================================================

# Konfigurasi Default (Dapat disesuaikan atau dilempar via parameter)
YEAR_MONTH="${1:-2026-09}"      # Tahun & Bulan (format: YYYY-MM)
START_DAY=1                     # Tanggal mulai (1)
END_DAY=25                      # Tanggal akhir (25)
OPERATOR="${2:-232}"            # Operator ID (default 232 sesuai container produksi)
CONTAINER_ID="8f31c8f9acf8"     # ID Container Docker di server produksi

echo "=================================================================="
echo "Memulai Sinkronisasi ARPU secara berurutan..."
echo "Operator   : $OPERATOR"
echo "Bulan/Tahun: $YEAR_MONTH"
echo "Rentang    : Tanggal $START_DAY s/d Tanggal $END_DAY"
echo "Container  : $CONTAINER_ID"
echo "=================================================================="
echo ""

# Loop berurutan dari tanggal 1 sampai 25
for day in $(seq -w $START_DAY $END_DAY); do
    DATE="${YEAR_MONTH}-${day}"
    echo "------------------------------------------------------------------"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Menjalankan fetch untuk tanggal: $DATE"
    echo "------------------------------------------------------------------"

    # Jalankan perintah melalui docker container dengan memory_limit 2048M
    docker exec "$CONTAINER_ID" php -d memory_limit=2048M /app/artisan arpu:fetch --operator="$OPERATOR" --date="$DATE" --force

    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Selesai untuk tanggal: $DATE (SUKSES)"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Peringatan: Proses tanggal $DATE selesai dengan kode error: $EXIT_CODE"
    fi

    echo ""
    # Jeda singkat 2 detik antar tanggal untuk stabilisasi koneksi
    sleep 2
done

echo "=================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Seluruh proses rentang tanggal 1 - 25 selesai!"
echo "=================================================================="
