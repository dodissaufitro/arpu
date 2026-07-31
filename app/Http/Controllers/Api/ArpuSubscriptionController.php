<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArpuSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ArpuSubscriptionController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Define validation rules based on schema
        $validator = Validator::make($request->all(), [
            'msisdn' => 'required|string|max:100',
            'country' => 'nullable|string|max:50',
            'operator' => 'nullable|string|max:100',
            'id_operator' => 'nullable|string|max:50',
            'service' => 'nullable|string|max:50',
            'keyword' => 'nullable|string|max:50',
            'source' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:50',
            'cycle' => 'nullable|string|max:20',
            'adnet' => 'nullable|string|max:20',
            'revenue' => 'nullable|numeric',
            'subs_date' => 'nullable|string|max:50',
            'renewal_date' => 'nullable|string|max:50',
            'freemium_end_date' => 'nullable|string|max:50',
            'unsubs_from' => 'nullable|string|max:50',
            'unsubs_date' => 'nullable|string|max:50',
            'service_price' => 'nullable|numeric',
            'currency' => 'nullable|string|max:10',
            'profile_status' => 'nullable|string|max:50',
            'publisher' => 'nullable|string|max:100',
            'trxid' => 'nullable|string|max:50',
            'pixel' => 'nullable|string|max:50',
            'handset' => 'nullable|string|max:50',
            'browser' => 'nullable|string|max:50',
            'attempt_charging' => 'nullable|integer',
            'success_billing' => 'nullable|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Insert the data
        try {
            $subscription = ArpuSubscription::create($validator->validated());
            
            return response()->json([
                'success' => true,
                'message' => 'Data subscription berhasil ditambahkan',
                'data' => $subscription
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat menyimpan data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
