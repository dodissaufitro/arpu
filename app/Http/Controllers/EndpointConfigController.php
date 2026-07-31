<?php

namespace App\Http\Controllers;

use App\Models\EndpointConfig;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\ArpuFetchService;
use Carbon\Carbon;

class EndpointConfigController extends Controller
{
    public function index(Request $request)
    {
        $query = EndpointConfig::where('date_mode', 'fixed');

        if ($request->filled('operator_name')) {
            $query->where('operator_name', $request->operator_name);
        }

        if ($request->filled('service_name')) {
            $query->where('service_name', $request->service_name);
        }

        $configs = $query->latest()->get();

        $operatorServices = EndpointConfig::where('date_mode', 'fixed')
            ->whereNotNull('operator_name')
            ->select('operator_name', 'service_name')
            ->distinct()
            ->get()
            ->groupBy('operator_name')
            ->map(function ($items) {
                return $items->pluck('service_name')->filter()->values();
            });

        return Inertia::render('EndpointConfigs/Index', [
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
            'date_mode' => 'required|string|in:fixed,yesterday',
            'target_date' => 'nullable|required_if:date_mode,fixed|date',
        ]);

        EndpointConfig::create($validated);

        return redirect()->back()->with('success', 'Endpoint configuration added successfully.');
    }

    public function update(Request $request, EndpointConfig $endpointConfig)
    {
        $validated = $request->validate([
            'operator' => 'required|integer',
            'operator_name' => 'nullable|string|max:255',
            'id_service' => 'required|integer',
            'service_name' => 'nullable|string|max:255',
            'date_mode' => 'required|string|in:fixed,yesterday',
            'target_date' => 'nullable|required_if:date_mode,fixed|date',
        ]);

        $endpointConfig->update($validated);

        return redirect()->back()->with('success', 'Endpoint configuration updated successfully.');
    }

    public function push(EndpointConfig $endpointConfig, ArpuFetchService $arpuFetchService)
    {
        $targetDateStr = $endpointConfig->date_mode === 'yesterday' 
            ? Carbon::yesterday()->format('Y-m-d')
            : $endpointConfig->target_date->format('Y-m-d');

        $result = $arpuFetchService->fetchAndSync(
            $endpointConfig->operator,
            $endpointConfig->id_service,
            $targetDateStr
        );

        if ($result['success']) {
            $endpointConfig->update([
                'last_run_at' => Carbon::now(),
                'status' => 'success',
            ]);
            return redirect()->back()->with('success', $result['message']);
        } else {
            $endpointConfig->update([
                'last_run_at' => Carbon::now(),
                'status' => 'failed',
            ]);
            return redirect()->back()->with('error', $result['message']);
        }
    }

    public function destroy(EndpointConfig $endpointConfig)
    {
        $endpointConfig->delete();
        return redirect()->back()->with('success', 'Endpoint configuration deleted.');
    }
}
