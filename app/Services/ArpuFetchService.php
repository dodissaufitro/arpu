<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ArpuFetchService
{
    /**
     * Check if a specific date for operator and service has already been successfully synced.
     */
    public function isAlreadySynced($operator, $idService, $date)
    {
        return DB::table('arpu_sync_logs')
            ->where('operator', (string)$operator)
            ->where('id_service', (string)$idService)
            ->where('sync_date', (string)$date)
            ->where('status', 'success')
            ->first();
    }

    /**
     * Record a sync log entry.
     */
    public function recordSyncLog($operator, $idService, $date, $totalInserted = 0, $totalUpdated = 0, $status = 'success', $notes = null)
    {
        return DB::table('arpu_sync_logs')->updateOrInsert(
            [
                'operator' => (string)$operator,
                'id_service' => (string)$idService,
                'sync_date' => (string)$date,
            ],
            [
                'total_inserted' => $totalInserted,
                'total_updated' => $totalUpdated,
                'status' => $status,
                'notes' => $notes,
                'updated_at' => Carbon::now(),
                'created_at' => Carbon::now(),
            ]
        );
    }

    /**
     * Download and process staging data.
     */
    public function fetchAndSync($operator, $idService, $date, $force = false)
    {
        $downloadResult = $this->downloadData($operator, $idService, $date, $force);
        if (!$downloadResult['success']) {
            return $downloadResult;
        }

        return $this->processStagingData($operator, $idService, $date);
    }

    /**
     * Download ARPU data from API and store in staging table.
     */
    public function downloadData($operator, $idService, $date, $force = false)
    {
        if (!$force) {
            $existingLog = $this->isAlreadySynced($operator, $idService, $date);
            if ($existingLog) {
                $syncedAt = $existingLog->created_at ? Carbon::parse($existingLog->created_at)->format('d M Y H:i:s') : 'sebelumnya';
                return [
                    'success' => false,
                    'is_duplicate' => true,
                    'message' => "Data tanggal {$date} untuk Operator {$operator} / Service {$idService} sudah pernah disinkronisasi pada {$syncedAt}. Proses dibatalkan untuk mencegah dobel hitung revenue.",
                ];
            }
        }

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
    public function processStagingData($operator = null, $idService = null, $date = null)
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

                    // 1. Cari data langganan yang sesuai untuk nomor & service ini di arpu_subscriptions
                    $existingArpu = null;

                    if (!empty($record->subs_date) && $record->subs_date !== 'NA' && !str_starts_with((string)$record->subs_date, '0000')) {
                        // Cari record dengan MSISDN + Operator + Service + subs_date yang sama persis
                        $existingArpu = DB::table('arpu_subscriptions')
                            ->where('msisdn', $msisdn)
                            ->where('id_operator', $id_operator)
                            ->where('id_service', $id_service)
                            ->where('subs_date', $record->subs_date)
                            ->first();
                    }

                    // 2. Jika tidak ada kecocokan subs_date yang persis:
                    if (!$existingArpu) {
                        $candidate = DB::table('arpu_subscriptions')
                            ->where('msisdn', $msisdn)
                            ->where('id_operator', $id_operator)
                            ->where('id_service', $id_service)
                            ->orderByDesc('id')
                            ->first();

                        if ($candidate) {
                            $isCandidateClosed = ($candidate->status == '-1' || (!empty($candidate->unsubs_date) && !str_starts_with($candidate->unsubs_date, '9999') && !str_starts_with($candidate->unsubs_date, '0000')));

                            if (!$isCandidateClosed) {
                                $existingArpu = $candidate;
                            }
                        }
                    }

                    // ATURAN: Jika MSISDN tidak ada subs_date-nya di arpu_subscriptions, abaikan saja (jangan dilanjutkan)
                    if ($existingArpu) {
                        if (empty($existingArpu->subs_date) || $existingArpu->subs_date === 'NA' || str_starts_with((string)$existingArpu->subs_date, '0000')) {
                            DB::table('arpu_api_subscriptions')->where('id', $record->id)->delete();
                            continue;
                        }
                    } else {
                        // Jika belum ada di arpu_subscriptions dan data masuk juga tidak ada subs_date: abaikan
                        if (empty($record->subs_date) || $record->subs_date === 'NA' || str_starts_with((string)$record->subs_date, '0000')) {
                            DB::table('arpu_api_subscriptions')->where('id', $record->id)->delete();
                            continue;
                        }
                    }

                    $hasRegDate = !empty($record->subs_date) && !str_starts_with($record->subs_date, '0000') && $record->subs_date !== 'NA';

                    if ($existingArpu) {
                        $updateData = [
                            'revenue' => (float)($existingArpu->revenue ?? 0) + $new_revenue,
                        ];

                        if ($hasRegDate) {
                            // Saat data lama (update): tidak usah ditambah 1, pertahankan nilai yang sudah ada di database
                        } else {
                            // Jika tanggal reg tidak ada: samakan langsung dengan arpu_api_subscriptions
                            $updateData['attempt_charging'] = (int)($record->attempt_charging ?? 0);
                            $updateData['success_billing'] = (int)($record->success_billing ?? 0);
                        }

                        // Parse timestamp perbandingan untuk mendeteksi data tanggal mundur (backdate)
                        $recordRenewalTs = !empty($record->renewal_date) && !str_starts_with($record->renewal_date, '0000')
                            ? strtotime($record->renewal_date)
                            : null;
                        $existingRenewalTs = !empty($existingArpu->renewal_date) && !str_starts_with($existingArpu->renewal_date, '0000')
                            ? strtotime($existingArpu->renewal_date)
                            : null;

                        // 1. renewal_date: Hanya perbarui jika tanggal dari data baru LEBIH BARU (tidak tertimpa mundur)
                        if ($recordRenewalTs !== null) {
                            if ($existingRenewalTs === null || $recordRenewalTs > $existingRenewalTs) {
                                $updateData['renewal_date'] = $record->renewal_date;
                            }
                        }

                        // Tentukan timestamp aktivitas terakhir kedua data
                        $recordLatestTs = $recordRenewalTs
                            ?: (!empty($record->subs_date) && !str_starts_with($record->subs_date, '0000') ? strtotime($record->subs_date) : null)
                            ?: (!empty($record->created_at) ? strtotime($record->created_at) : null);

                        $existingLatestTs = $existingRenewalTs
                            ?: (!empty($existingArpu->subs_date) && !str_starts_with($existingArpu->subs_date, '0000') ? strtotime($existingArpu->subs_date) : null)
                            ?: (!empty($existingArpu->created_at) ? strtotime($existingArpu->created_at) : null);

                        $isBackdate = ($recordLatestTs !== null && $existingLatestTs !== null && $recordLatestTs < $existingLatestTs);

                        // 2. status & unsubs_date: Hanya perbarui jika data bukan tanggal mundur (lebih baru atau sama)
                        if (!$isBackdate) {
                            if ($status !== null && $existingArpu->status != $status) {
                                $updateData['status'] = $status;
                            }
                            if (!empty($record->unsubs_date) && $existingArpu->unsubs_date != $record->unsubs_date) {
                                $updateData['unsubs_date'] = $record->unsubs_date;
                            }
                        }

                        // 3. subs_date (Tanggal Registrasi): Selalu simpan tanggal yang PALING AWAL (REG asli)
                        $recordSubsTs = !empty($record->subs_date) && !str_starts_with($record->subs_date, '0000')
                            ? strtotime($record->subs_date)
                            : null;
                        $existingSubsTs = !empty($existingArpu->subs_date) && !str_starts_with($existingArpu->subs_date, '0000')
                            ? strtotime($existingArpu->subs_date)
                            : null;

                        $isEarlierReg = ($recordSubsTs !== null && ($existingSubsTs === null || $recordSubsTs < $existingSubsTs));

                        if ($isEarlierReg) {
                            $updateData['subs_date'] = $record->subs_date;

                            // Atribusi registrasi asli (adnet, publisher, keyword, source, pixel) diprioritaskan dari data REG
                            $regFields = ['adnet', 'keyword', 'source', 'publisher', 'pixel', 'handset', 'browser'];
                            foreach ($regFields as $field) {
                                if (!empty($record->$field) && $record->$field !== 'NA') {
                                    $updateData[$field] = $record->$field;
                                }
                            }
                        }

                        // 4. Lengkapi metadata lainnya jika di data lama masih kosong / NA
                        $metaFields = ['adnet', 'keyword', 'source', 'publisher', 'handset', 'browser', 'service_price', 'currency', 'profile_status', 'trxid', 'pixel'];
                        foreach ($metaFields as $field) {
                            if (!isset($updateData[$field]) && (empty($existingArpu->$field) || $existingArpu->$field === 'NA') && !empty($record->$field) && $record->$field !== 'NA') {
                                $updateData[$field] = $record->$field;
                            }
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
                        
                        if ($hasRegDate) {
                            // Jika ada tanggal reg: ikuti rumus sebelumnya
                            $arpuRecordData['attempt_charging'] = 1;
                            $arpuRecordData['success_billing'] = ($new_revenue != 0) ? 1 : 0;
                        } else {
                            // Jika tanggal reg tidak ada: samakan langsung dengan arpu_api_subscriptions
                            $arpuRecordData['attempt_charging'] = (int)($record->attempt_charging ?? 0);
                            $arpuRecordData['success_billing'] = (int)($record->success_billing ?? 0);
                        }

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

            if ($operator && $idService && $date) {
                $this->recordSyncLog(
                    $operator,
                    $idService,
                    $date,
                    $totalInserted,
                    $totalUpdated,
                    'success',
                    "Proses sinkronisasi selesai. Inserted: {$totalInserted}, Updated: {$totalUpdated}"
                );
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
