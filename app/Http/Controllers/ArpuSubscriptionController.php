<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ArpuSubscription;

class ArpuSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = ArpuSubscription::query();

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

        $metrics = [
            'total_data' => (clone $query)->count(),
            'total_active' => (clone $query)->where('status', '1')->count(),
            'total_inactive' => (clone $query)->where('status', '-1')->count(),
            'total_revenue' => (clone $query)->sum('revenue') ?? 0,
        ];

        $subscriptions = $query->latest()->paginate(10)->onEachSide(1)->withQueryString();

        return Inertia::render('arpu_subscriptions/index', [
            'subscriptions' => $subscriptions,
            'metrics' => $metrics,
        ]);
    }
}
