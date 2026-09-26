<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\OperatorServiceSyncService;

class CheckNewServices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'arpu:check-new-services {--operator= : Filter by Operator ID} {--mode=yesterday : Date mode for new configs (yesterday|fixed)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pengecekan service baru dari API untuk operator yang sudah terdaftar dan otomatis mendaftarkannya ke sistem';

    /**
     * Execute the console command.
     */
    public function handle(OperatorServiceSyncService $syncService)
    {
        $operator = $this->option('operator');
        $dateMode = $this->option('mode') ?: 'yesterday';

        $this->info('================================================================');
        $this->info('  PENGECEKAN SERVICE BARU TERHADAP OPERATOR TERDAFTAR');
        $this->info('================================================================');
        
        if ($operator) {
            $this->info("Target Operator: {$operator}");
        } else {
            $this->info("Target: Seluruh Operator yang sudah terdaftar di sistem");
        }
        $this->info("Date Mode: {$dateMode}");
        $this->newLine();

        $result = $syncService->syncAllOperators($operator, $dateMode);

        $tableRows = [];
        $newServicesList = [];

        foreach ($result['details'] as $detail) {
            $status = $detail['success'] ? '<fg=green>OK</>' : '<fg=red>FAILED</>';
            $newBadge = $detail['new_count'] > 0 
                ? "<fg=yellow;options=bold>+{$detail['new_count']} BARU</>" 
                : '<fg=gray>0</>';

            $tableRows[] = [
                $detail['operator'],
                $detail['operator_name'] ?? '-',
                $detail['total_api'] ?? 0,
                $newBadge,
                $status,
                $detail['message'] ?? '',
            ];

            if (!empty($detail['new_services'])) {
                foreach ($detail['new_services'] as $ns) {
                    $newServicesList[] = [
                        'operator' => $detail['operator'],
                        'operator_name' => $detail['operator_name'],
                        'id_service' => $ns['id_service'],
                        'service_name' => $ns['service_name'],
                    ];
                }
            }
        }

        $this->table(
            ['Operator ID', 'Operator Name', 'Total API', 'Service Baru', 'Status', 'Keterangan'],
            $tableRows
        );

        $this->newLine();

        if ($result['total_new_services'] > 0) {
            $this->info("Daftar Service Baru yang Otomatis Didaftarkan:");
            foreach ($newServicesList as $item) {
                $this->line("  - [<fg=cyan>ID: {$item['id_service']}</>] {$item['service_name']} (Operator: {$item['operator']} - {$item['operator_name']})");
            }
            $this->newLine();
            $this->info("<fg=green;options=bold>Sukses!</> Berhasil mendaftarkan total {$result['total_new_services']} service baru ke sistem.");
        } else {
            $this->info("<fg=green>Semua service sudah up-to-date.</> Tidak ada service baru yang ditemukan pada operator yang diperiksa.");
        }

        return Command::SUCCESS;
    }
}
