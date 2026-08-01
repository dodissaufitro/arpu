<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('arpu_subscriptions', function (Blueprint $table) {
            $table->index('status');
            $table->index('subs_date');
            // Composite index for fast upsert checks
            $table->index(['msisdn', 'id_service', 'id_operator'], 'arpu_subs_unique_check_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('arpu_subscriptions', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['subs_date']);
            $table->dropIndex('arpu_subs_unique_check_idx');
        });
    }
};
