#!/bin/bash

# Arahkan ke direktori project
cd c:/laragon/www/arpu_subscription || exit

echo "Memulai otomatisasi Sinkronisasi ARPU..."

# Jalankan perintah fetch all (Download ke staging, lalu Sync ke tabel utama)
php artisan arpu:fetch

echo "Otomatisasi selesai."
