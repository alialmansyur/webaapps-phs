<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Faskes;
use App\Models\District;
use App\Models\Village;
use App\Models\Regency;

$json = file_get_contents(__DIR__ . '/mapping2.json');
$data = json_decode($json, true);

$regency = Regency::where('name', 'LIKE', '%BANDUNG%')
    ->where('name', 'NOT LIKE', '%BARAT%')
    ->where('name', 'NOT LIKE', '%KOTA%')
    ->first() ?? Regency::find('3204');

foreach($data as $row) {
    if (trim($row['kecamatan']) === 'KECAMATAN' || trim($row['kecamatan']) === '') continue;

    $puskesmasName = trim($row['puskesmas']);
    $desaName = trim($row['desa']);

    if ($puskesmasName === 'BANJARAN KOTA') $puskesmasName = 'BANJARAN';
    if ($puskesmasName === 'PASIR JAMBU') $puskesmasName = 'PASIRJAMBU';

    // Find Faskes by fuzzy name
    $faskes = Faskes::where('type', 'PUSKESMAS')
        ->where(function($q) use ($puskesmasName) {
            $q->where('name', 'LIKE', '%' . $puskesmasName . '%')
              ->orWhereRaw("REPLACE(name, ' ', '') LIKE ?", ['%' . str_replace(' ', '', $puskesmasName) . '%']);
        })
        ->first();

    if (!$faskes) {
        echo "Faskes not found for Puskesmas: $puskesmasName\n";
        continue;
    }

    // Find Village globally in Regency (by looking up District first, or just joining)
    // reg_villages has district_id. reg_districts has regency_id.
    $village = Village::whereHas('district', function($q) use ($regency) {
            $q->where('regency_id', $regency->id);
        })
        ->where(function($q) use ($desaName) {
            $q->where('name', 'LIKE', '%' . $desaName . '%')
              ->orWhereRaw("REPLACE(name, ' ', '') LIKE ?", ['%' . str_replace(' ', '', $desaName) . '%']);
        })
        ->first();

    if ($village) {
        // Update Faskes District based on the Village's district! 
        // This is more accurate than the Excel's Kecamatan column if merged cells caused misalignment.
        $district = $village->district;
        if ($faskes->district_id !== $district->id) {
            $faskes->district_id = $district->id;
            $faskes->district_name = $district->name;
            $faskes->regency_name = $regency->name;
            $faskes->save();
        }

        if (!$faskes->villages()->where('village_id', $village->id)->exists()) {
            $faskes->villages()->attach($village->id);
            echo "Attached Village {$village->name} (District {$district->name}) to Faskes {$faskes->name}\n";
        }
    } else {
        echo "Village not found globally: $desaName\n";
    }
}

echo "Update 3 complete.\n";
