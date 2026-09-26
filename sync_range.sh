#!/bin/bash

# ==============================================================================
# Script Sinkronisasi ARPU Berurutan (Sequential Date Range Fetch)
# ==============================================================================

# Konfigurasi Parameter (Dapat diatur langsung atau dilempar via argument)
# Contoh pemakaian:
# ./sync_range.sh                    -> Menjalankan default tgl 1 - 2
# ./sync_range.sh 2026-09 232 1 25   -> Menjalankan tgl 1 - 25

YEAR_MONTH="${1:-2026-09}"      # Tahun & Bulan (format: YYYY-MM)
OPERATOR="${2:-232}"            # Operator ID (default: 232)
START_DAY="${3:-1}"             # Tanggal mulai (default: 1)
END_DAY="${4:-2}"               # Tanggal akhir (default: 2)
CONTAINER_ID="8f31c8f9acf8"     # ID Container Docker di server produksi

echo "=================================================================="
echo "Memulai Sinkronisasi ARPU secara berurutan..."
echo "Operator   : $OPERATOR"
echo "Bulan/Tahun: $YEAR_MONTH"
echo "Rentang    : Tanggal $START_DAY s/d Tanggal $END_DAY"
echo "=================================================================="
echo ""

# Loop berurutan dari tanggal START_DAY sampai END_DAY
for (( day=10#$START_DAY; day<=10#$END_DAY; day++ )); do
    DAY_PADDED=$(printf "%02d" $day)
    DATE="${YEAR_MONTH}-${DAY_PADDED}"
    echo "------------------------------------------------------------------"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Menjalankan fetch untuk tanggal: $DATE"
    echo "------------------------------------------------------------------"

    # Deteksi apakah berjalan di lingkungan Docker atau Native PHP
    if command -v docker >/dev/null 2>&1 && docker ps -q 2>/dev/null | grep -q "$CONTAINER_ID"; then
        echo "Eksekusi via Docker Container: $CONTAINER_ID"
        docker exec "$CONTAINER_ID" php -d memory_limit=2048M /app/artisan arpu:fetch --operator="$OPERATOR" --date="$DATE" --force
    else
        echo "Eksekusi via PHP Lokal / Host"
        php -d memory_limit=2048M artisan arpu:fetch --operator="$OPERATOR" --date="$DATE" --force
    fi

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
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Seluruh proses rentang tanggal $START_DAY - $END_DAY selesai!"
echo "=================================================================="
