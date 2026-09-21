<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mstr_region_statuses', function (Blueprint $table) {
            $table->id();
            $table->enum('region_level', ['PROVINSI', 'KABUPATEN', 'KECAMATAN', 'DESA']);
            $table->string('region_id', 10);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['region_level', 'region_id']);
            $table->index(['region_level', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mstr_region_statuses');
    }
};
