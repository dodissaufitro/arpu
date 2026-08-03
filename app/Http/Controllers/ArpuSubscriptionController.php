<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ArpuSubscription;

class ArpuSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $hasFilters = $request->filled('search') || $request->filled('id_operator') || $request->filled('id_service') || $request->filled('start_date') || $request->filled('end_date');

        $query = ArpuSubscription::query();

        if (!$hasFilters) {
            // Return empty query if no filters applied to save load
            $query->whereRaw('1 = 0');
        }

        if ($request->filled('search')) {
            $query->where('msisdn', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('id_operator')) {
            $query->where('id_operator', $request->id_operator);
        }

        if ($request->filled('id_service')) {
            $query->where('id_service', $request->id_service);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('subs_date', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        } elseif ($request->filled('start_date')) {
            $query->where('subs_date', '>=', $request->start_date . ' 00:00:00');
        } elseif ($request->filled('end_date')) {
            $query->where('subs_date', '<=', $request->end_date . ' 23:59:59');
        }

        $filterParams = $request->except('page');
        $cacheKey = 'arpu_metrics_' . md5(json_encode($filterParams));

        $metrics = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($query) {
            $stats = (clone $query)->selectRaw('
                COUNT(*) as total_data,
                SUM(CASE WHEN status = "1" THEN 1 ELSE 0 END) as total_active,
                SUM(CASE WHEN status = "-1" THEN 1 ELSE 0 END) as total_inactive,
                SUM(revenue) as total_revenue
            ')->first();

            return [
                'total_data' => $stats->total_data ?? 0,
                'total_active' => (int) ($stats->total_active ?? 0),
                'total_inactive' => (int) ($stats->total_inactive ?? 0),
                'total_revenue' => (float) ($stats->total_revenue ?? 0),
            ];
        });

        $operatorServices = \Illuminate\Support\Facades\Cache::remember('arpu_operator_services', 86400, function () {
            return ArpuSubscription::select('id_operator', 'operator', 'id_service', 'service')
                ->whereNotNull('id_operator')
                ->whereNotNull('id_service')
                ->distinct()
                ->get()
                ->groupBy('id_operator')
                ->map(function ($items) {
                    $operatorName = $items->first()->operator;
                    $services = $items->map(function ($item) {
                        return [
                            'id_service' => $item->id_service,
                            'service_name' => $item->service,
                        ];
                    })->unique('id_service')->values()->toArray();

                    return [
                        'id_operator' => $items->first()->id_operator,
                        'operator_name' => $operatorName,
                        'services' => $services,
                    ];
                })->values()->toArray();
        });

        $endpointConfigs = \Illuminate\Support\Facades\Cache::remember('arpu_endpoint_configs_list', 60, function () {
            return \App\Models\EndpointConfig::where('date_mode', 'yesterday')
                ->select('operator', 'operator_name', 'id_service', 'service_name')
                ->distinct()
                ->get()
                ->groupBy('operator')
                ->map(function ($items) {
                    $operatorName = $items->first()->operator_name;
                    $services = $items->map(function ($item) {
                        return [
                            'id_service' => $item->id_service,
                            'service_name' => $item->service_name,
                        ];
                    })->unique('id_service')->values()->toArray();

                    return [
                        'operator' => $items->first()->operator,
                        'operator_name' => $operatorName,
                        'services' => $services,
                    ];
                })->values()->toArray();
        });

        $subscriptions = $query->latest()->paginate(25)->onEachSide(1)->withQueryString();

        return Inertia::render('arpu_subscriptions/index', [
            'subscriptions' => $subscriptions,
            'metrics' => $metrics,
            'operatorServices' => $operatorServices,
            'endpointConfigs' => $endpointConfigs,
        ]);
    }

    public function sync(Request $request, \App\Services\ArpuFetchService $arpuFetchService)
    {
        set_time_limit(0);
        
        try {
            $syncResult = $arpuFetchService->processStagingData();

            if ($syncResult['success']) {
                if ($syncResult['inserted'] == 0 && $syncResult['updated'] == 0) {
                    return back()->with('info', $syncResult['message']);
                }
                return back()->with('success', $syncResult['message']);
            } else {
                return back()->with('error', $syncResult['message']);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ARPU Sync Route Error: ' . $e->getMessage());
            return back()->with('error', 'Terjadi kesalahan sistem saat sinkronisasi: ' . $e->getMessage());
        }
    }
}
