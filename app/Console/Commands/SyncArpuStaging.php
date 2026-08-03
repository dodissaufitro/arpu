<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ArpuFetchService;

class SyncArpuStaging extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'arpu:sync-staging';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Proses sinkronisasi murni dari tabel antrean (arpu_api_subscriptions) ke tabel utama (arpu_subscriptions)';

    /**
     * Execute the console command.
     */
    public function handle(ArpuFetchService $arpuFetchService)
    {
        $this->info('Mulai sinkronisasi dari tabel antrean (staging) ke tabel utama...');
        
        $syncResult = $arpuFetchService->processStagingData();
        
        if ($syncResult['success']) {
            $this->info($syncResult['message']);
        } else {
            $this->error($syncResult['message']);
        }

        $this->newLine();
        $this->info('Proses Sinkronisasi Selesai!');
    }
}
