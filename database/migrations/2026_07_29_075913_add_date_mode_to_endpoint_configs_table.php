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
            $table->string('date_mode')->default('fixed')->after('id_service');
            $table->date('target_date')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('endpoint_configs', function (Blueprint $table) {
            $table->dropColumn('date_mode');
            $table->date('target_date')->nullable(false)->change();
        });
    }
};
