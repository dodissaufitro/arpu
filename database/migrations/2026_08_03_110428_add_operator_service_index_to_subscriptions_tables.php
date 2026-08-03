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
            $table->index(['id_operator', 'id_service']);
        });

        Schema::table('arpu_api_subscriptions', function (Blueprint $table) {
            $table->index(['id_operator', 'id_service']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('arpu_subscriptions', function (Blueprint $table) {
            $table->dropIndex(['id_operator', 'id_service']);
        });

        Schema::table('arpu_api_subscriptions', function (Blueprint $table) {
            $table->dropIndex(['id_operator', 'id_service']);
        });
    }
};
