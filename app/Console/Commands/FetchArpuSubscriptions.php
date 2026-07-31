<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\ArpuSubscription;
use Carbon\Carbon;

class FetchArpuSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'arpu:fetch';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch ARPU subscriptions from the API and store them in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fetching ARPU subscriptions from API...');

        $url = 'http://149.129.252.221/app/filetest/send_arpu_subs.php?operator=162&id_service=1955&date=2026-07-07';

        try {
            $response = Http::get($url);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['status']) && $data['status'] === 'success' && isset($data['data'])) {
                    $subscriptions = $data['data'];
                    $totalInserted = 0;
                    $totalUpdated = 0;
                    $this->withProgressBar($subscriptions, function ($subscription) use (&$totalInserted, &$totalUpdated) {
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
                            'attempt_charging' => $subscription['attempt_charging'],
                            'success_billing' => $subscription['success_billing'],
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
                                ];
                            } elseif ($incomingStatus == -1) {
                                $updateData = [
                                    'status' => -1,
                                    'unsubs_date' => $subscription['unsubs_date'] ?? null,
                                    'unsubs_from' => $subscription['unsubs_from'] ?? 'sms',
                                ];
                            }

                            if (!empty($updateData)) {
                                DB::table('arpu_subscriptions')
                                    ->where('id', $existingRecord->id)
                                    ->update($updateData);
                                $totalUpdated++;
                            }
                        } else {
                            // Jika belum ada di DB, langsung insert (baik status 1 maupun -1)
                            DB::table('arpu_subscriptions')->insert($recordData);
                            $totalInserted++;
                        }
                    });

                    $this->newLine();
                    $this->info("Successfully fetched data. Inserted: {$totalInserted} | Updated: {$totalUpdated}");
                } else {
                    $this->error('API response format is invalid or status is not success.');
                }
            } else {
                $this->error('Failed to fetch data from API. HTTP Status: ' . $response->status());
            }
        } catch (\Exception $e) {
            $this->error('An error occurred: ' . $e->getMessage());
        }
    }
}
