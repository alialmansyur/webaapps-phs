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
        Schema::create('trx_interventions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('survey_id')->constrained('trx_surveys')->onDelete('cascade');
            $table->foreignId('kader_id')->constrained('users')->onDelete('cascade');
            $table->string('topic');
            $table->text('result');
            $table->string('follow_up')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trx_interventions');
    }
};
