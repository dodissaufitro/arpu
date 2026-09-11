<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ArpuSubscription;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $query = ArpuSubscription::query();

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('subs_date', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        } elseif ($request->filled('start_date')) {
            $query->where('subs_date', '>=', $request->start_date . ' 00:00:00');
        } elseif ($request->filled('end_date')) {
            $query->where('subs_date', '<=', $request->end_date . ' 23:59:59');
        }

        if ($request->filled('operator')) {
            $query->where('operator', 'like', '%' . $request->operator . '%');
        }

        if ($request->filled('service')) {
            $query->where('service', 'like', '%' . $request->service . '%');
        }

        if ($request->filled('adnet')) {
            $query->where('adnet', 'like', '%' . $request->adnet . '%');
        }

        // Group by Date
        $revenueByDate = (clone $query)
            ->selectRaw('DATE(subs_date) as label, SUM(revenue) as value')
            ->whereNotNull('subs_date')
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        // Group by Operator
        $revenueByOperator = (clone $query)
            ->selectRaw('operator as label, SUM(revenue) as value')
            ->whereNotNull('operator')
            ->groupBy('label')
            ->orderByDesc('value')
            ->get();

        // Group by Service
        $revenueByService = (clone $query)
            ->selectRaw('service as label, SUM(revenue) as value')
            ->whereNotNull('service')
            ->groupBy('label')
            ->orderByDesc('value')
            ->get();

        // Group by AdNet
        $revenueByAdnet = (clone $query)
            ->selectRaw('adnet as label, SUM(revenue) as value')
            ->whereNotNull('adnet')
            ->groupBy('label')
            ->orderByDesc('value')
            ->get();


        // Dashboard Metrics
        $totalData = (clone $query)->count();
        $totalActive = (clone $query)->where('status', '1')->count();
        $totalInactive = (clone $query)->where('status', '-1')->count();
        $totalRevenue = (clone $query)->sum('revenue');

        return Inertia::render('dashboard', [
            'filters' => $request->only(['start_date', 'end_date', 'operator', 'service', 'adnet']),
            'charts' => [
                'by_date' => $revenueByDate,
                'by_operator' => $revenueByOperator,
                'by_service' => $revenueByService,
                'by_adnet' => $revenueByAdnet,
            ],
            'metrics' => [
                'total_data' => $totalData,
                'total_active' => $totalActive,
                'total_inactive' => $totalInactive,
                'total_revenue' => $totalRevenue
            ]
        ]);
    }
}
