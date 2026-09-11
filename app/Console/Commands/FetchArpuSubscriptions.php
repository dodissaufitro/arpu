<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\ArpuSubscription;
use App\Models\EndpointConfig;
use App\Services\ArpuFetchService;
use Carbon\Carbon;

class FetchArpuSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'arpu:fetch {--operator= : Filter by Operator ID} {--service= : Filter by Service ID} {--date= : Specific date to fetch (Y-m-d)} {--force : Force fetch even if already synced}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch ARPU subscriptions from the API and store them in the database';

    /**
     * Execute the console command.
     */
    public function handle(ArpuFetchService $arpuFetchService)
    {
        $this->info('Fetching ARPU subscriptions from Endpoint Configs (Daily Push)...');

        $operatorId = $this->option('operator');
        $serviceId = $this->option('service');
        $force = (bool) $this->option('force');

        $query = EndpointConfig::where('date_mode', 'yesterday');

        if ($operatorId) {
            $query->where('operator', $operatorId);
            $this->info("Filtering by Operator: {$operatorId}");
        }

        if ($serviceId) {
            $query->where('id_service', $serviceId);
            $this->info("Filtering by Service: {$serviceId}");
        }

        $configs = $query->get();

        if ($configs->isEmpty()) {
            $this->warn('No daily push configurations found.');
            return;
        }

        $targetDateStr = $this->option('date') ?: Carbon::yesterday()->format('Y-m-d');
        $this->info("Target Date: {$targetDateStr}");
        if ($force) {
            $this->warn("Mode Force: Mengabaikan proteksi duplikasi log.");
        }

        $successfulConfigs = [];

        $this->withProgressBar($configs, function ($config) use ($arpuFetchService, $targetDateStr, $force, &$successfulConfigs) {
            try {
                $result = $arpuFetchService->downloadData(
                    $config->operator,
                    $config->id_service,
                    $targetDateStr,
                    $force
                );

                if ($result['success']) {
                    $successfulConfigs[] = $config;
                    $config->update([
                        'last_run_at' => Carbon::now(),
                        'status' => 'success',
                    ]);
                } elseif ($result['is_duplicate'] ?? false) {
                    $this->warn("\nSkipped Operator: {$config->operator}, Service: {$config->id_service} - " . $result['message']);
                } else {
                    $this->error("\nFailed to download Operator: {$config->operator}, Service: {$config->id_service} - " . $result['message']);
                    $config->update([
                        'last_run_at' => Carbon::now(),
                        'status' => 'failed',
                    ]);
                }
            } catch (\Exception $e) {
                $this->error("\nFailed to download Operator: {$config->operator}, Service: {$config->id_service} - " . $e->getMessage());
                $config->update([
                    'last_run_at' => Carbon::now(),
                    'status' => 'failed',
                ]);
            }

            // Jeda 1 detik agar tidak membebani API
            sleep(1);
        });

        $this->newLine(2);
        $this->info('Semua data berhasil di-download ke tabel antrean (staging).');
        
        $this->info('Mulai sinkronisasi dari tabel antrean ke tabel utama...');
        
        $syncResult = $arpuFetchService->processStagingData();
        
        if ($syncResult['success']) {
            $this->info($syncResult['message']);
            foreach ($successfulConfigs as $sc) {
                $arpuFetchService->recordSyncLog(
                    $sc->operator,
                    $sc->id_service,
                    $targetDateStr,
                    0,
                    0,
                    'success',
                    'Auto fetched via CLI command'
                );
            }
        } else {
            $this->error($syncResult['message']);
        }

        $this->newLine();
        $this->info('Proses otomatisasi (Download & Sync) selesai sepenuhnya!');
    }
}
