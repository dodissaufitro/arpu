<?php

namespace App\Services;

use App\Models\EndpointConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class OperatorServiceSyncService
{
    /**
     * Get API base URL for service discovery.
     */
    protected function getServiceApiUrl(): string
    {
        return env('SYNC_SERVICE_API_URL', 'http://149.129.252.221/app/filetest/dataarpu/service.php');
    }

    /**
     * Get all distinct operators already registered in the system.
     */
    public function getRegisteredOperators(): array
    {
        $operators = [];

        // 1. Ambil dari endpoint_configs
        $configs = EndpointConfig::select('operator', 'operator_name')
            ->whereNotNull('operator')
            ->distinct()
            ->get();

        foreach ($configs as $cfg) {
            $opId = (int)$cfg->operator;
            if ($opId > 0 && !isset($operators[$opId])) {
                $operators[$opId] = [
                    'operator' => $opId,
                    'operator_name' => $cfg->operator_name ?: "Operator {$opId}",
                ];
            }
        }

        // 2. Ambil dari riwayat arpu_subscriptions jika ada operator yang belum ada di endpoint_configs
        try {
            $fromSubs = DB::table('arpu_subscriptions')
                ->select('id_operator', 'operator')
                ->whereNotNull('id_operator')
                ->where('id_operator', '<>', '')
                ->distinct()
                ->get();

            foreach ($fromSubs as $sub) {
                $opId = (int)$sub->id_operator;
                if ($opId > 0 && !isset($operators[$opId])) {
                    $operators[$opId] = [
                        'operator' => $opId,
                        'operator_name' => $sub->operator ?: "Operator {$opId}",
                    ];
                }
            }
        } catch (\Exception $e) {
            // Abaikan jika tabel belum siap
        }

        return array_values($operators);
    }

    /**
     * Check and auto-register new services for a specific operator.
     *
     * @param int|string $operator
     * @param string|null $fallbackOperatorName
     * @param string $dateMode ('yesterday' or 'fixed')
     * @return array
     */
    public function syncOperatorServices($operator, ?string $fallbackOperatorName = null, string $dateMode = 'yesterday'): array
    {
        $operator = (int)$operator;
        $url = $this->getServiceApiUrl();

        try {
            $response = Http::timeout(30)->get($url, [
                'operator' => $operator
            ]);

            if (!$response->successful()) {
                Log::warning("Service discovery failed for operator {$operator}: HTTP " . $response->status());
                return [
                    'success' => false,
                    'operator' => $operator,
                    'operator_name' => $fallbackOperatorName ?: "Operator {$operator}",
                    'message' => "API HTTP Error: " . $response->status(),
                    'new_count' => 0,
                    'total_api' => 0,
                    'new_services' => [],
                ];
            }

            $data = $response->json();
            if (!isset($data['status']) || $data['status'] !== 'success' || !isset($data['data'])) {
                return [
                    'success' => false,
                    'operator' => $operator,
                    'operator_name' => $fallbackOperatorName ?: "Operator {$operator}",
                    'message' => $data['message'] ?? 'Format respons API tidak valid',
                    'new_count' => 0,
                    'total_api' => 0,
                    'new_services' => [],
                ];
            }

            $apiServices = $data['data'];
            $newServices = [];
            $newCount = 0;

            foreach ($apiServices as $item) {
                $idService = (int)($item['id_service'] ?? 0);
                if ($idService <= 0) {
                    continue;
                }

                $operatorRule = !empty($item['operator_rule']) ? $item['operator_rule'] : $fallbackOperatorName;
                $keyword = $item['keyword'] ?? 'NA';

                // Cek apakah service ini sudah terdaftar di mode tersebut (misal Daily Push: yesterday)
                $existing = EndpointConfig::where('operator', $operator)
                    ->where('id_service', $idService)
                    ->where('date_mode', $dateMode)
                    ->first();

                if (!$existing) {
                    // Otomatis daftarkan service baru ke sistem
                    EndpointConfig::create([
                        'operator' => $operator,
                        'operator_name' => $operatorRule,
                        'id_service' => $idService,
                        'service_name' => $keyword,
                        'date_mode' => $dateMode,
                        'target_date' => null,
                        'status' => null,
                        'last_run_at' => null,
                    ]);

                    $newCount++;
                    $newServices[] = [
                        'id_service' => $idService,
                        'service_name' => $keyword,
                        'operator_name' => $operatorRule,
                    ];

                    Log::info("Service baru berhasil didaftarkan otomatis: Operator {$operator} ({$operatorRule}) - Service {$idService} ({$keyword})");
                } else {
                    // Lengkapi / perbarui operator_name atau service_name jika di database masih kosong
                    $needsUpdate = false;
                    $updateData = [];

                    if (empty($existing->service_name) && !empty($keyword) && $keyword !== 'NA') {
                        $updateData['service_name'] = $keyword;
                        $needsUpdate = true;
                    }
                    if (empty($existing->operator_name) && !empty($operatorRule)) {
                        $updateData['operator_name'] = $operatorRule;
                        $needsUpdate = true;
                    }

                    if ($needsUpdate) {
                        $existing->update($updateData);
                    }
                }
            }

            return [
                'success' => true,
                'operator' => $operator,
                'operator_name' => $fallbackOperatorName ?: ($apiServices[0]['operator_rule'] ?? "Operator {$operator}"),
                'total_api' => count($apiServices),
                'new_count' => $newCount,
                'new_services' => $newServices,
                'message' => "Ditemukan {$newCount} service baru dari total " . count($apiServices) . " service di API.",
            ];
        } catch (\Exception $e) {
            Log::error("Error syncing services for operator {$operator}: " . $e->getMessage());
            return [
                'success' => false,
                'operator' => $operator,
                'operator_name' => $fallbackOperatorName ?: "Operator {$operator}",
                'message' => $e->getMessage(),
                'new_count' => 0,
                'total_api' => 0,
                'new_services' => [],
            ];
        }
    }

    /**
     * Check and auto-register new services for all registered operators.
     *
     * @param int|string|null $specificOperator
     * @param string $dateMode
     * @return array
     */
    public function syncAllOperators($specificOperator = null, string $dateMode = 'yesterday'): array
    {
        $operators = $this->getRegisteredOperators();

        if ($specificOperator !== null) {
            $operators = array_values(array_filter($operators, fn($o) => (string)$o['operator'] === (string)$specificOperator));
            
            // Jika operator belum ada di daftar terdaftar, masukkan sebagai operator target baru
            if (empty($operators)) {
                $operators = [
                    [
                        'operator' => (int)$specificOperator,
                        'operator_name' => "Operator {$specificOperator}",
                    ]
                ];
            }
        }

        $results = [];
        $totalNewServices = 0;

        foreach ($operators as $op) {
            $res = $this->syncOperatorServices($op['operator'], $op['operator_name'], $dateMode);
            $results[] = $res;
            if ($res['success']) {
                $totalNewServices += $res['new_count'];
            }
        }

        return [
            'success' => true,
            'total_operators_checked' => count($operators),
            'total_new_services' => $totalNewServices,
            'details' => $results,
        ];
    }
}
