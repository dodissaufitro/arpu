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
    public function handle(ArpuFetchService $arpuFetchService)
    {
        $this->info('Fetching ARPU subscriptions from Endpoint Configs (Daily Push)...');

        $configs = EndpointConfig::where('date_mode', 'yesterday')->get();

        if ($configs->isEmpty()) {
            $this->warn('No daily push configurations found.');
            return;
        }

        $targetDateStr = Carbon::yesterday()->format('Y-m-d');
        $this->info("Target Date: {$targetDateStr}");

        $this->withProgressBar($configs, function ($config) use ($arpuFetchService, $targetDateStr) {
            try {
                $result = $arpuFetchService->fetchAndSync(
                    $config->operator,
                    $config->id_service,
                    $targetDateStr
                );

                if ($result['success']) {
                    $config->update([
                        'last_run_at' => Carbon::now(),
                        'status' => 'success',
                    ]);
                } else {
                    $config->update([
                        'last_run_at' => Carbon::now(),
                        'status' => 'failed',
                    ]);
                }
            } catch (\Exception $e) {
                $this->error("\nFailed to process Operator: {$config->operator}, Service: {$config->id_service} - " . $e->getMessage());
                $config->update([
                    'last_run_at' => Carbon::now(),
                    'status' => 'failed',
                ]);
            }
        });

        $this->newLine(2);
        $this->info('Daily push completed!');
    }
}
