<?php

namespace Database\Seeders;

use App\Models\District;
use Illuminate\Database\Seeder;

class RegionScopeSeeder extends Seeder
{
    public function run(): void
    {
        // Seeder wilayah contoh dinonaktifkan agar tidak mencampur data backup asli.
        if (! District::query()->exists()) {
            return;
        }
    }
}
