<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ArpuFetchService
{
    /**
     * Fetch ARPU data for a specific operator, service, and date.
     * 
     * @param int $operator
     * @param int $idService
     * @param string $date
     * @return array ['success' => bool, 'message' => string, 'inserted' => int, 'updated' => int]
     */
    public function fetchAndSync($operator, $idService, $date)
    {
        $url = "http://149.129.252.221/app/filetest/send_arpu_subs.php?operator={$operator}&id_service={$idService}&date={$date}";

        try {
            $response = Http::get($url);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['status']) && $data['status'] === 'success' && isset($data['data'])) {
                    $subscriptions = $data['data'];
                    $totalInserted = 0;
                    $totalUpdated = 0;

                    foreach ($subscriptions as $subscription) {
                        $recordData = [
                            'country' => $subscription['country'] ?? null,
                            'operator' => $subscription['operator_name'] ?? null,
                            'id_service' => $subscription['id_service'] ?? null,
                            'id_operator' => $subscription['id_operator'] ?? null,
                            'service' => $subscription['service'] ?? null,
                            'keyword' => $subscription['keyword'] ?? 'NA',
                            'source' => $subscription['source'] ?? 'NA',
                            'msisdn' => $subscription['msisdn'] ?? null,
                            'status' => $subscription['status'] ?? null,
                            'cycle' => $subscription['cycle'] ?? 'daily',
                            'adnet' => $subscription['adnet'] ?? null,
                            'revenue' => isset($subscription['revenue']) ? (float)$subscription['revenue'] : null,
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

                        $existingRecord = DB::table('arpu_subscriptions')
                            ->where('msisdn', $subscription['msisdn'])
                            ->where('id_service', $subscription['id_service'])
                            ->where('id_operator', $subscription['id_operator'])
                            ->first();

                        if ($existingRecord) {
                            $updateData = [];
                            $incomingStatus = $subscription['status'] ?? null;
                            
                            if ($incomingStatus == 1) {
                                $updateData = [
                                    'status' => 1,
                                    'renewal_date' => $subscription['renewal_date'] ?? null,
                                    'trxid' => $subscription['trxid'] ?? 'NA',
                                    'attempt_charging' => $subscription['attempt_charging'] ?? 0,
                                    'success_billing' => $subscription['success_billing'] ?? 0,
                                    'service_price' => isset($subscription['service_price']) ? (float)$subscription['service_price'] : null,
                                ];
                            } elseif ($incomingStatus == -1) {
                                $updateData = [
                                    'status' => -1,
                                    'unsubs_date' => $subscription['unsubs_date'] ?? null,
                                    'unsubs_from' => $subscription['unsubs_from'] ?? 'sms',
                                    'service_price' => isset($subscription['service_price']) ? (float)$subscription['service_price'] : null,
                                ];
                            }

                            if (!empty($updateData)) {
                                DB::table('arpu_subscriptions')
                                    ->where('id', $existingRecord->id)
                                    ->update($updateData);
                                $totalUpdated++;
                            }
                        } else {
                            DB::table('arpu_subscriptions')->insert($recordData);
                            $totalInserted++;
                        }
                    }
                    if ($totalInserted > 0 || $totalUpdated > 0) {
                        \Illuminate\Support\Facades\Cache::forget('arpu_operator_services');
                    }

                    return [
                        'success' => true,
                        'message' => "Successfully fetched data. Inserted: {$totalInserted} | Updated: {$totalUpdated}",
                        'inserted' => $totalInserted,
                        'updated' => $totalUpdated,
                    ];
                } else {
                    return [
                        'success' => false,
                        'message' => 'API response format is invalid or status is not success.',
                    ];
                }
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to fetch data from API. HTTP Status: ' . $response->status(),
                ];
            }
        } catch (\Exception $e) {
            Log::error('ArpuFetchService error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }
}
