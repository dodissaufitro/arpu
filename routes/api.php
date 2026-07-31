<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ArpuSubscriptionController;

Route::middleware(['api.token'])->group(function () {
    Route::post('/arpu-subscriptions', [ArpuSubscriptionController::class, 'store']);
});
