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
        Schema::create('arpu_api_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('country', 50)->nullable()->index();
            $table->string('operator_name', 100)->nullable();
            $table->string('id_operator', 50)->nullable()->index();
            $table->string('id_service', 50)->nullable()->index();
            $table->string('service', 50)->nullable();
            $table->string('keyword', 50)->nullable()->default('NA');
            $table->string('source', 50)->nullable()->default('NA');
            $table->string('msisdn', 100)->nullable()->index();
            $table->string('status', 50)->nullable();
            $table->string('cycle', 20)->nullable()->default('daily');
            $table->string('adnet', 20)->nullable();
            $table->decimal('revenue', 10, 2)->nullable();
            $table->string('subs_date', 50)->nullable();
            $table->string('renewal_date', 50)->nullable();
            $table->string('freemium_end_date', 50)->nullable();
            $table->string('unsubs_from', 50)->nullable()->default('sms');
            $table->string('unsubs_date', 50)->nullable();
            $table->decimal('service_price', 10, 2)->nullable();
            $table->string('currency', 10)->nullable()->default('NA');
            $table->string('profile_status', 50)->nullable()->default('NA');
            $table->string('publisher', 100)->nullable()->default('NA');
            $table->string('trxid', 50)->nullable()->default('NA');
            $table->string('pixel', 50)->nullable()->default('NA');
            $table->string('handset', 50)->nullable()->default('NA');
            $table->string('browser', 50)->nullable()->default('NA');
            $table->integer('attempt_charging')->nullable();
            $table->integer('success_billing')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arpu_api_subscriptions');
    }
};
