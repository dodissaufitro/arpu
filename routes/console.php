<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

// Cek dan daftarkan service baru secara otomatis setiap hari sebelum proses fetch harian
Schedule::command('arpu:check-new-services')->dailyAt('00:50');

// Menjalankan command arpu:fetch setiap hari pada jam 01:00 pagi
Schedule::command('arpu:fetch')->dailyAt('01:00');

