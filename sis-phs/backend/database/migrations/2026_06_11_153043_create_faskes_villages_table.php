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
        Schema::create('mstr_faskes_villages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('faskes_id');
            $table->string('village_id', 10);
            $table->timestamps();

            $table->foreign('faskes_id')->references('id')->on('mstr_faskes')->onDelete('cascade');
            $table->foreign('village_id')->references('id')->on('reg_villages')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mstr_faskes_villages');
    }
};
