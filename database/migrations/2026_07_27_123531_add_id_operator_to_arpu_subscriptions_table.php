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
            $table->string('id_operator', 50)->nullable()->after('operator');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('arpu_subscriptions', function (Blueprint $table) {
            $table->dropColumn('id_operator');
        });
    }
};
