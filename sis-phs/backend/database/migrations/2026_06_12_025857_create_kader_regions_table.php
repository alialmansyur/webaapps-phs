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
        Schema::create('kader_regions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('village_id', 20);
            $table->string('rt', 10);
            $table->string('rw', 10);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('village_id')->references('id')->on('reg_villages')->cascadeOnUpdate()->restrictOnDelete();
            // unique combination to prevent duplicates
            $table->unique(['user_id', 'village_id', 'rt', 'rw']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kader_regions');
    }
};
