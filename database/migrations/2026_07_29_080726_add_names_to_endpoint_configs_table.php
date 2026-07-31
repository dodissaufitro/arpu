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
        Schema::table('endpoint_configs', function (Blueprint $table) {
            $table->string('operator_name')->nullable()->after('operator');
            $table->string('service_name')->nullable()->after('id_service');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('endpoint_configs', function (Blueprint $table) {
            $table->dropColumn(['operator_name', 'service_name']);
        });
    }
};
