<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ArpuFetchService
{
    /**
     * Download and process staging data.
     */
    public function fetchAndSync($operator, $idService, $date)
    {
        $downloadResult = $this->downloadData($operator, $idService, $date);
        if (!$downloadResult['success']) {
            return $downloadResult;
        }

        return $this->processStagingData();
    }

    /**
     * Download ARPU data from API and store in staging table.
     */
    public function downloadData($operator, $idService, $date)
    {
        $baseUrl = env('ENDPOINT_API_SUBSCRIPTION', 'http://149.129.252.221/app/filetest/dataarpu/api_subscription.php');

        try {
            $response = Http::timeout(180)->get($baseUrl, [
                'operator' => $operator,
                'id_service' => $idService,
                'date' => $date,
            ]);


            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['status']) && $data['status'] === 'success' && isset($data['data'])) {
                    $subscriptions = $data['data'];
                    $totalInserted = 0;

                    foreach ($subscriptions as $subscription) {
                        $recordData = [
                            'country' => $subscription['country'] ?? null,
                            'operator_name' => $subscription['operator_name'] ?? null,
                            'id_operator' => $subscription['id_operator'] ?? null,
                            'id_service' => $subscription['id_service'] ?? null,
                            'service' => $subscription['service'] ?? null,
                            'keyword' => $subscription['keyword'] ?? 'NA',
                            'source' => $subscription['source'] ?? 'NA',
                            'msisdn' => $subscription['msisdn'] ?? null,
                            'status' => $subscription['status'] ?? null,
                            'cycle' => $subscription['cycle'] ?? 'daily',
                            'adnet' => $subscription['adnet'] ?? null,
                            'revenue' => isset($subscription['revenue']) ? (float)$subscription['revenue'] : 0,
                            'subs_date' => $subscription['subs_date'] ?? null,
                            'renewal_date' => $subscription['renewal_date'] ?? null,
                            'freemium_end_date' => $subscription['freemium_end_date'] ?? null,
                            'unsubs_from' => $subscription['unsubs_from'] ?? 'sms',
                            'unsubs_date' => $subscription['unsubs_date'] ?? null,
                            'service_price' => isset($subscription['service_price']) ? (float)$subscription['service_price'] : null,
                            'currency' => $subscription['currency'] ?? 'NA',
                            'profile_status' => $subscription['profile_status'] ?? 'NA',
                            'publisher' => $subscription['publisher'] ?? 'NA',
                            'trxid' => $subscription['trxid'] ?? 'NA',
                            'pixel' => $subscription['pixel'] ?? 'NA',
                            'handset' => $subscription['handset'] ?? 'NA',
                            'browser' => $subscription['browser'] ?? 'NA',
                            'attempt_charging' => $subscription['attempt_charging'] ?? 0,
                            'success_billing' => $subscription['success_billing'] ?? 0,
                            'created_at' => isset($subscription['created_at']) ? Carbon::parse($subscription['created_at']) : Carbon::now(),
                        ];

                        DB::table('arpu_api_subscriptions')->insert($recordData);
                        $totalInserted++;
                    }

                    return [
                        'success' => true,
                        'message' => "Successfully downloaded {$totalInserted} records to staging.",
                    ];
                }
                return ['success' => false, 'message' => 'API response format is invalid.'];
            }
            return ['success' => false, 'message' => 'Failed to call API: HTTP ' . $response->status()];
        } catch (\Exception $e) {
            Log::error('ArpuFetchService Download Error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Process all data from staging to main table and delete staging rows.
     */
    public function processStagingData()
    {
        try {
            $totalInserted = 0;
            $totalUpdated = 0;
            
            $hasRecords = DB::table('arpu_api_subscriptions')->exists();
            
            if (!$hasRecords) {
                return [
                    'success' => true,
                    'message' => 'Tidak ada data staging yang perlu diproses.',
                    'inserted' => 0,
                    'updated' => 0
                ];
            }

            DB::table('arpu_api_subscriptions')->orderBy('id')->chunkById(1000, function ($stagedRecords) use (&$totalInserted, &$totalUpdated) {
                foreach ($stagedRecords as $record) {
                    $msisdn = $record->msisdn;
                    $id_operator = $record->id_operator;
                    $id_service = $record->id_service;
                    $status = $record->status;
                    $new_revenue = $record->revenue ? (float)$record->revenue : 0;

                    $existingArpu = DB::table('arpu_subscriptions')
                        ->where('msisdn', $msisdn)
                        ->where('id_operator', $id_operator)
                        ->where('id_service', $id_service)
                        ->first();

                    if ($existingArpu) {
                        $updateData = [
                            'attempt_charging' => $existingArpu->attempt_charging + 1,
                            'revenue' => $existingArpu->revenue + $new_revenue,
                        ];
                        
                        if ($existingArpu->status != $status) {
                            $updateData['status'] = $status;
                        }
                        
                        if ($existingArpu->renewal_date != $record->renewal_date) {
                            $updateData['renewal_date'] = $record->renewal_date;
                        }
                        
                        if ($new_revenue != 0) {
                            $updateData['success_billing'] = $existingArpu->success_billing + 1;
                        }

                        DB::table('arpu_subscriptions')
                            ->where('id', $existingArpu->id)
                            ->update($updateData);
                        $totalUpdated++;
                    } else {
                        $arpuRecordData = (array)$record;
                        unset($arpuRecordData['id']);
                        
                        // arpu_subscriptions table does not have updated_at column
                        if (array_key_exists('updated_at', $arpuRecordData)) {
                            unset($arpuRecordData['updated_at']);
                        }
                        
                        if (isset($arpuRecordData['operator_name'])) {
                            $arpuRecordData['operator'] = $arpuRecordData['operator_name'];
                            unset($arpuRecordData['operator_name']);
                        }
                        
                        $arpuRecordData['attempt_charging'] = 1;
                        $arpuRecordData['success_billing'] = ($new_revenue != 0) ? 1 : 0;

                        DB::table('arpu_subscriptions')->insert($arpuRecordData);
                        $totalInserted++;
                    }

                    DB::table('arpu_api_subscriptions')->where('id', $record->id)->delete();
                }
            });
            
            if ($totalInserted > 0 || $totalUpdated > 0) {
                \Illuminate\Support\Facades\Cache::forget('arpu_operator_services');
                \Illuminate\Support\Facades\Artisan::call('cache:clear');
            }

            return [
                'success' => true,
                'message' => "Proses sinkronisasi selesai. Inserted: {$totalInserted}, Updated: {$totalUpdated}",
                'inserted' => $totalInserted,
                'updated' => $totalUpdated
            ];
            
        } catch (\Exception $e) {
            Log::error('ARPU Sync Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat sinkronisasi: ' . $e->getMessage(),
                'inserted' => 0,
                'updated' => 0
            ];
        }
    }
}
