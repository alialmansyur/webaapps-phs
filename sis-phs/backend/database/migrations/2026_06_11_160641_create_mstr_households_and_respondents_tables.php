<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('mstr_households')) {
            Schema::create('mstr_households', function (Blueprint $table) {
                $table->id();
                $table->string('no_kk', 20)->nullable();
                $table->string('head_of_family_name');
                $table->char('village_id', 10);
                $table->string('rw', 10)->nullable();
                $table->string('rt', 10)->nullable();
                $table->timestamps();

                $table->foreign('village_id')->references('id')->on('reg_villages')->cascadeOnUpdate()->restrictOnDelete();
            });
        }

        if (!Schema::hasTable('mstr_respondents')) {
            Schema::create('mstr_respondents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('household_id')->constrained('mstr_households')->cascadeOnDelete();
                $table->string('nik', 20)->nullable();
                $table->string('name');
                $table->date('birth_date')->nullable();
                $table->enum('gender', ['L', 'P'])->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('mstr_respondents');
        Schema::dropIfExists('mstr_households');
    }
};
