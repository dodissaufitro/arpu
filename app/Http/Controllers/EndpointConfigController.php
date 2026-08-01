<?php

namespace App\Http\Controllers;

use App\Models\EndpointConfig;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\ArpuFetchService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

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

    public function syncData(Request $request)
    {
        $request->validate([
            'operator' => 'required|integer',
        ]);

        $url = env('SYNC_SERVICE_API_URL', 'http://149.129.252.221/app/filetest/dataarpu/service.php');
        
        $response = Http::get($url, [
            'operator' => $request->operator
        ]);

        if ($response->successful()) {
            $data = $response->json();
            
            if (isset($data['status']) && $data['status'] === 'success' && isset($data['data'])) {
                $count = 0;
                foreach ($data['data'] as $item) {
                    EndpointConfig::updateOrCreate(
                        [
                            'operator' => $item['operator'],
                            'id_service' => $item['id_service']
                        ],
                        [
                            'operator_name' => $item['operator_rule'],
                            'service_name' => $item['keyword'],
                            'date_mode' => 'yesterday',
                            'target_date' => null,
                        ]
                    );
                    $count++;
                }

                return redirect()->back()->with('success', "Berhasil mensinkronisasi $count data Endpoint Configs dari API.");
            }
        }

        return redirect()->back()->with('error', 'Gagal mengambil data dari API.');
    }
}
