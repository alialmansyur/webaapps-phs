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
        Schema::create('mst_faskes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('type', ['PUSKESMAS', 'PUSTU', 'POSKESDES'])->default('PUSKESMAS');
            $table->string('district_id')->nullable();
            $table->string('district_name')->nullable();
            $table->string('regency_name')->nullable();
            $table->string('village_focus')->nullable();
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('cadre_count')->default(0);
            $table->integer('household_coverage')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mst_faskes');
    }
};
