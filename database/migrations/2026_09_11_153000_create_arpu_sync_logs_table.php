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
        Schema::create('arpu_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('operator', 50)->index();
            $table->string('id_service', 50)->index();
            $table->string('sync_date', 50)->index();
            $table->integer('total_inserted')->default(0);
            $table->integer('total_updated')->default(0);
            $table->string('status', 20)->default('success')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['operator', 'id_service', 'sync_date'], 'arpu_sync_logs_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arpu_sync_logs');
    }
};
