<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

// Menjalankan command arpu:fetch setiap hari pada jam 01:00 pagi
Schedule::command('arpu:fetch')->dailyAt('01:00');
