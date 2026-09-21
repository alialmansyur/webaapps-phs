<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mstr_questions', function (Blueprint $table) {
            $table->string('indicator', 255)->after('code')->nullable();
            $table->integer('max_age')->after('min_age')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('mstr_questions', function (Blueprint $table) {
            $table->dropColumn(['indicator', 'max_age']);
        });
    }
};
