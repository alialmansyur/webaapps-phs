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
        Schema::table('dinkes_puskesmas', function (Blueprint $table) {
            $table->dropForeign('dinkes_puskesmas_puskesmas_id_foreign');
            $table->foreign('puskesmas_id')->references('id')->on('mstr_faskes')->cascadeOnDelete();
        });

        Schema::table('user_scopes', function (Blueprint $table) {
            $table->dropForeign('user_scopes_puskesmas_id_foreign');
            $table->foreign('puskesmas_id')->references('id')->on('mstr_faskes')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Skip down because the old puskesmas table might not exist
    }
};
