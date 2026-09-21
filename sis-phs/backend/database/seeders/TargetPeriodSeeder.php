<?php

namespace Database\Seeders;

use App\Models\Period;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TargetPeriodSeeder extends Seeder
{
    public function run(): void
    {
        $targets = [
            2025 => 17,
            2026 => 19,
            2027 => 21,
            2028 => 23,
            2029 => 25,
        ];

        DB::transaction(function () use ($targets) {
            foreach ($targets as $year => $percentage) {
                $period = Period::query()->updateOrCreate(
                    ['year' => $year],
                    [
                        'name' => 'Periode Tahunan ' . $year,
                        'type' => 'REGULAR',
                        'start_date' => $year . '-01-01',
                        'end_date' => $year . '-12-31',
                        'status' => 'ACTIVE',
                        'is_active' => true,
                        'description' => 'Target PHS Nasional ' . $year,
                    ]
                );

                $period->yearlyTarget()->updateOrCreate(
                    ['period_id' => $period->id],
                    ['target_value' => $percentage]
                );
            }
        });
    }
}
