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

        $configs = $query->latest()->get();

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

    public function push(EndpointConfig $dailyPush, ArpuFetchService $arpuFetchService)
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
            return redirect()->back()->with('success', $result['message']);
        } else {
            $dailyPush->update([
                'last_run_at' => Carbon::now(),
                'status' => 'failed',
            ]);
            return redirect()->back()->with('error', $result['message']);
        }
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

    public function destroy(EndpointConfig $dailyPush)
    {
        $dailyPush->delete();
        return redirect()->back()->with('success', 'Configuration deleted.');
    }
}
