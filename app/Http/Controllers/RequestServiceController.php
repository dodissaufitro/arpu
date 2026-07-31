<?php

namespace App\Http\Controllers;

use App\Models\RequestService;
use Illuminate\Http\Request;

class RequestServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = RequestService::query();

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where('operator', 'like', "%{$search}%")
                  ->orWhere('service', 'like', "%{$search}%")
                  ->orWhere('keyword', 'like', "%{$search}%");
        }

        $services = $query->latest()->get();

        return \Inertia\Inertia::render('RequestService/Index', [
            'services' => $services,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $isSuperAdmin = $request->user()->role === 'Admin Utama';

        $rules = [
            'operator' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('request_services')->where(function ($query) use ($request) {
                    return $query->where('service', $request->service)
                                 ->where('keyword', $request->keyword);
                })
            ],
            'service' => 'required|string|max:255',
            'keyword' => 'required|string|max:255',
            'price' => 'required|string|max:255',
            'negara' => 'required|string|max:255',
            'sdc' => 'required|string|max:255',
        ];

        if ($isSuperAdmin) {
            $rules['url_wap'] = 'nullable|url|max:255';
            $rules['status'] = 'required|string|max:255';
        }

        $messages = [
            'operator.unique' => 'Kombinasi Operator, Service, dan Keyword ini sudah ada di dalam sistem.',
        ];

        $validated = $request->validate($rules, $messages);

        if (!$isSuperAdmin) {
            $validated['url_wap'] = null;
            $validated['status'] = 'Request';
        }

        RequestService::create($validated);

        return redirect()->back()->with('success', 'Request Service created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(RequestService $requestService)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(RequestService $requestService)
    {
        //
    }

    public function update(Request $request, RequestService $requestService)
    {
        $isSuperAdmin = $request->user()->role === 'Admin Utama';

        if (!$isSuperAdmin && strtolower($requestService->status) !== 'request') {
            abort(403, 'You can only edit this when the status is request.');
        }

        $rules = [
            'operator' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('request_services')->where(function ($query) use ($request) {
                    return $query->where('service', $request->service)
                                 ->where('keyword', $request->keyword);
                })->ignore($requestService->id)
            ],
            'service' => 'required|string|max:255',
            'keyword' => 'required|string|max:255',
            'price' => 'required|string|max:255',
            'negara' => 'required|string|max:255',
            'sdc' => 'required|string|max:255',
        ];

        if ($isSuperAdmin) {
            $rules['url_wap'] = 'nullable|url|max:255';
            $rules['status'] = 'required|string|max:255';
        }

        $messages = [
            'operator.unique' => 'Kombinasi Operator, Service, dan Keyword ini sudah ada di dalam sistem.',
        ];

        $validated = $request->validate($rules, $messages);

        if (!$isSuperAdmin) {
            $validated['url_wap'] = $requestService->url_wap;
            $validated['status'] = $requestService->status;
        }

        $requestService->update($validated);

        return redirect()->back()->with('success', 'Request Service updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, RequestService $requestService)
    {
        $isSuperAdmin = $request->user()->role === 'Admin Utama';

        if (!$isSuperAdmin && strtolower($requestService->status) === 'active') {
            abort(403, 'Hanya Superadmin yang dapat menghapus data dengan status Active.');
        }

        $requestService->delete();
        
        return redirect()->back()->with('success', 'Request Service deleted successfully.');
    }
}
