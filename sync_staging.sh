#!/bin/bash

# Arahkan ke direktori project
cd c:/laragon/www/arpu_subscription || exit

echo "Memulai sinkronisasi murni dari tabel antrean (staging) ke tabel utama..."

# Jalankan perintah khusus untuk memproses data dari arpu_api_subscriptions ke arpu_subscriptions
php artisan arpu:sync-staging

echo "Proses Sinkronisasi selesai."
