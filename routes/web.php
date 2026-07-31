<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;

Route::middleware('guest')->get('/', function () {
    return Inertia::render('auth/login', [
        'canResetPassword' => Route::has('password.request'),
        'status' => session('status'),
    ]);
})->name('home');
Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::get('arpu-subscriptions', [\App\Http\Controllers\ArpuSubscriptionController::class, 'index'])->name('arpu_subscriptions.index')->middleware('permission:arpu.view');

    Route::middleware('permission:tokens.view')->group(function () {
        Route::get('api-tokens', [\App\Http\Controllers\ApiTokenController::class, 'index'])->name('api_tokens.index');
        Route::post('api-tokens', [\App\Http\Controllers\ApiTokenController::class, 'store'])->name('api_tokens.store');
        Route::put('api-tokens/{apiToken}', [\App\Http\Controllers\ApiTokenController::class, 'update'])->name('api_tokens.update');
    });

    Route::middleware('permission:endpoints.view')->group(function () {
        Route::get('endpoint-configs', [\App\Http\Controllers\EndpointConfigController::class, 'index'])->name('endpoint_configs.index');
        Route::post('endpoint-configs', [\App\Http\Controllers\EndpointConfigController::class, 'store'])->name('endpoint_configs.store');
        Route::put('endpoint-configs/{endpointConfig}', [\App\Http\Controllers\EndpointConfigController::class, 'update'])->name('endpoint_configs.update');
        Route::delete('endpoint-configs/{endpointConfig}', [\App\Http\Controllers\EndpointConfigController::class, 'destroy'])->name('endpoint_configs.destroy');
        Route::post('endpoint-configs/{endpointConfig}/push', [\App\Http\Controllers\EndpointConfigController::class, 'push'])->name('endpoint_configs.push');
    });

    Route::middleware('permission:dailypush.view')->group(function () {
        Route::get('daily-push', [\App\Http\Controllers\DailyPushController::class, 'index'])->name('daily_push.index');
        Route::post('daily-push', [\App\Http\Controllers\DailyPushController::class, 'store'])->name('daily_push.store');
        Route::put('daily-push/{dailyPush}', [\App\Http\Controllers\DailyPushController::class, 'update'])->name('daily_push.update');
        Route::post('daily-push/push-all', [\App\Http\Controllers\DailyPushController::class, 'pushAll'])->name('daily_push.pushAll');
        Route::delete('daily-push/{dailyPush}', [\App\Http\Controllers\DailyPushController::class, 'destroy'])->name('daily_push.destroy');
        Route::post('daily-push/{dailyPush}/push', [\App\Http\Controllers\DailyPushController::class, 'push'])->name('daily_push.push');
    });

    Route::resource('request-service', \App\Http\Controllers\RequestServiceController::class)->middleware('permission:requests.view');

    Route::get('data-pemohon', function () {
        return Inertia::render('data-pemohon', [
            'dataPemohon' => \App\Models\DataPemohon::latest()->paginate(20)->onEachSide(1)
        ]);
    })->name('data.pemohon');

    Route::get('data-lokasi', function () {
        return Inertia::render('data-lokasi', [
            'dataLokasi' => \App\Models\MasterLokasi::latest('updated_at')->get()
        ]);
    })->name('data.lokasi');

    Route::get('data-bank', function () {
        return Inertia::render('data-bank', [
            'dataBank' => \App\Models\MasterBank::latest('updated_at')->get()
        ]);
    })->name('data.bank');

    Route::get('statistics', function (Illuminate\Http\Request $request) {
        $lokasiId = $request->query('lokasi', '');
        $bankId = $request->query('bank', '');
        $tahun = $request->query('tahun', '');
        $bulan = $request->query('bulan', '');
        $hari = $request->query('hari', '');

        $response = \Illuminate\Support\Facades\Http::withToken('57|iZEjvoRSBd9w5fvMmWn5BMzBWKIeV8kNqVdoOADAe41f97c3')
            ->get("http://dev_verifikator.test/api/data-pemohon/count-rekap-semua-tahap?lokasi={$lokasiId}&bank={$bankId}&tahun={$tahun}&bulan={$bulan}&hari={$hari}");

        $apiData = $response->json();

        return Inertia::render('statistics', [
            'apiData' => $apiData && isset($apiData['success']) && $apiData['success'] ? $apiData : null,
            'lokasi' => \App\Models\MasterLokasi::all(),
            'banks' => \App\Models\MasterBank::all(),
            'filters' => [
                'lokasi' => $lokasiId,
                'bank' => $bankId,
                'tahun' => $tahun,
                'bulan' => $bulan,
                'hari' => $hari,
            ]
        ]);
    })->name('statistics');

    Route::post('statistics/sync', function (Illuminate\Http\Request $request) {
        $request->validate(['data' => 'required|array']);
        
        // Pass to the existing API controller
        $req = new \Illuminate\Http\Request();
        $req->replace(['data' => $request->input('data')]);
        
        $response = app(\App\Http\Controllers\Api\ExternalStatusController::class)->store($req);
        
        if ($response->getStatusCode() == 201) {
            return back()->with('success', 'Data statistik berhasil disinkronisasi ke database internal.');
        }
        return back()->with('error', 'Gagal mensinkronisasi data statistik.');
    })->name('statistics.sync');

    Route::get('unit-hunian', [\App\Http\Controllers\UnitHunianController::class, 'index'])->name('unit-hunian.index');
    Route::post('unit-hunian', [\App\Http\Controllers\UnitHunianController::class, 'store'])->name('unit-hunian.store');
    Route::put('unit-hunian/{unitHunian}', [\App\Http\Controllers\UnitHunianController::class, 'update'])->name('unit-hunian.update');
    Route::delete('unit-hunian/{unitHunian}', [\App\Http\Controllers\UnitHunianController::class, 'destroy'])->name('unit-hunian.destroy');

    // User & Role Management
    Route::resource('users', UserController::class)->except(['create', 'show', 'edit'])->middleware('permission:users.view');
    Route::resource('roles', RoleController::class)->except(['create', 'show', 'edit'])->middleware('permission:roles.view');

    Route::get('tokens', function () {
        return Inertia::render('tokens', [
            'tokens' => \Laravel\Sanctum\PersonalAccessToken::latest()->get()
        ]);
    })->name('tokens');

    Route::post('tokens', function (Illuminate\Http\Request $request) {
        $request->validate([
            'token_name' => 'required|string|max:255',
        ]);
        
        $token = $request->user()->createToken($request->token_name, ['data:send']);
        
        return response()->json([
            'message' => 'Token created successfully',
            'plainTextToken' => $token->plainTextToken
        ]);
    })->name('tokens.store');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
