<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mstr_periods', function (Blueprint $table) {
            $table->string('name')->nullable()->after('year');
            $table->enum('type', ['REGULAR', 'FOLLOW_UP', 'PILOT', 'SPECIAL'])->default('REGULAR')->after('name');
            $table->date('start_date')->nullable()->after('type');
            $table->date('end_date')->nullable()->after('start_date');
            $table->enum('status', ['DRAFT', 'ACTIVE', 'CLOSED'])->default('DRAFT')->after('end_date');
            $table->text('note')->nullable()->after('description');
        });

        DB::table('mstr_periods')
            ->select(['id', 'year', 'is_active', 'description'])
            ->orderBy('id')
            ->get()
            ->each(function (object $period): void {
                DB::table('mstr_periods')
                    ->where('id', $period->id)
                    ->update([
                        'name' => $period->year ? sprintf('Periode Tahunan %s', $period->year) : 'Periode Tahunan',
                        'status' => $period->is_active ? 'ACTIVE' : 'DRAFT',
                        'note' => $period->description,
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('mstr_periods', function (Blueprint $table) {
            $table->dropColumn(['name', 'type', 'start_date', 'end_date', 'status', 'note']);
        });
    }
};
