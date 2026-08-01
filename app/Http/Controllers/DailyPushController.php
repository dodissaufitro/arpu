<?php

namespace App\Http\Controllers;

use App\Models\EndpointConfig;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\ArpuFetchService;
use Carbon\Carbon;

class DailyPushController extends Controller
{
    public function index(Request $request)
    {
        $query = EndpointConfig::where('date_mode', 'yesterday');

        if ($request->filled('operator_name')) {
            $query->where('operator_name', $request->operator_name);
        }

        if ($request->filled('service_name')) {
            $query->where('service_name', $request->service_name);
        }

        $configs = $query->latest()->paginate(15)->withQueryString();

        $operatorServices = EndpointConfig::where('date_mode', 'yesterday')
            ->whereNotNull('operator_name')
            ->select('operator_name', 'service_name')
            ->distinct()
            ->get()
            ->groupBy('operator_name')
            ->map(function ($items) {
                return $items->pluck('service_name')->filter()->values();
            });
        
        return Inertia::render('DailyPush/Index', [
            'configs' => $configs,
            'filters' => $request->only(['operator_name', 'service_name']),
            'operatorServices' => $operatorServices,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'operator' => 'required|integer',
            'operator_name' => 'nullable|string|max:255',
            'id_service' => 'required|integer',
            'service_name' => 'nullable|string|max:255',
        ]);

        $validated['date_mode'] = 'yesterday';
        $validated['target_date'] = null;

        EndpointConfig::create($validated);

        return redirect()->back()->with('success', 'Daily push configuration added successfully.');
    }

    public function update(Request $request, EndpointConfig $dailyPush)
    {
        $validated = $request->validate([
            'operator' => 'required|integer',
            'operator_name' => 'nullable|string|max:255',
            'id_service' => 'required|integer',
            'service_name' => 'nullable|string|max:255',
        ]);

        $dailyPush->update($validated);

        return redirect()->back()->with('success', 'Daily push configuration updated successfully.');
    }

    public function push(Request $request, EndpointConfig $dailyPush, ArpuFetchService $arpuFetchService)
    {
        // For Daily Push, the target date is always H-1 (yesterday)
        $targetDateStr = Carbon::yesterday()->format('Y-m-d');

        $result = $arpuFetchService->fetchAndSync(
            $dailyPush->operator,
            $dailyPush->id_service,
            $targetDateStr
        );

        if ($result['success']) {
            $dailyPush->update([
                'last_run_at' => Carbon::now(),
                'status' => 'success',
            ]);
            
            if ($request->wantsJson()) {
                return response()->json(['success' => true, 'message' => $result['message']]);
            }
            return redirect()->back()->with('success', $result['message']);
        } else {
            $dailyPush->update([
                'last_run_at' => Carbon::now(),
                'status' => 'failed',
            ]);
            
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $result['message']], 400);
            }
            return redirect()->back()->with('error', $result['message']);
        }
    }

    public function getAllIds()
    {
        $ids = EndpointConfig::where('date_mode', 'yesterday')->pluck('id');
        return response()->json(['ids' => $ids]);
    }

    public function pushAll(ArpuFetchService $arpuFetchService)
    {
        $configs = EndpointConfig::where('date_mode', 'yesterday')->get();
        $targetDateStr = Carbon::yesterday()->format('Y-m-d');
        
        $successCount = 0;
        $failCount = 0;

        foreach ($configs as $config) {
            $result = $arpuFetchService->fetchAndSync(
                $config->operator,
                $config->id_service,
                $targetDateStr
            );

            if ($result['success']) {
                $config->update(['last_run_at' => Carbon::now(), 'status' => 'success']);
                $successCount++;
            } else {
                $config->update(['last_run_at' => Carbon::now(), 'status' => 'failed']);
                $failCount++;
            }
        }

        return redirect()->back()->with('success', "Push All completed. Success: {$successCount}, Failed: {$failCount}.");
    }

    public function syncFromEndpointConfigs()
    {
        // Get all unique operator and id_service from Endpoint Configs (fixed)
        $endpointConfigs = EndpointConfig::where('date_mode', 'fixed')->get();

        $syncedCount = 0;
        foreach ($endpointConfigs as $config) {
            // Check if this combination already exists in Daily Push (yesterday)
            $exists = EndpointConfig::where('date_mode', 'yesterday')
                ->where('operator', $config->operator)
                ->where('id_service', $config->id_service)
                ->exists();

            if (!$exists) {
                EndpointConfig::create([
                    'operator' => $config->operator,
                    'operator_name' => $config->operator_name,
                    'id_service' => $config->id_service,
                    'service_name' => $config->service_name,
                    'date_mode' => 'yesterday',
                    'target_date' => null,
                ]);
                $syncedCount++;
            }
        }

        return redirect()->back()->with('success', "Berhasil menyinkronkan {$syncedCount} konfigurasi baru dari Endpoint Configs ke Daily Push (H-1).");
    }

    public function destroy(EndpointConfig $dailyPush)
    {
        $dailyPush->delete();
        return redirect()->back()->with('success', 'Configuration deleted.');
    }
}
