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
        Schema::create('request_services', function (Blueprint $table) {
            $table->id();
            $table->string('operator')->nullable();
            $table->string('service')->nullable();
            $table->string('keyword')->nullable();
            $table->string('price')->nullable();
            $table->string('negara')->nullable();
            $table->string('sdc')->nullable();
            $table->string('url_wap')->nullable();
            $table->string('status')->default('Request');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_services');
    }
};
