<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Faskes;
use App\Models\Puskesmas;
use App\Models\District;
use App\Models\Village;
use App\Models\Regency;
use Illuminate\Support\Str;

$json = file_get_contents(__DIR__ . '/mapping2.json');
$data = json_decode($json, true);

$faskesUpdated = [];
$villagesAttached = 0;

// Find Regency KABUPATEN BANDUNG
$regency = Regency::where('name', 'LIKE', '%BANDUNG%')
    ->where('name', 'NOT LIKE', '%BARAT%')
    ->where('name', 'NOT LIKE', '%KOTA%')
    ->first();

if (!$regency) {
    // fallback to ID 3204
    $regency = Regency::find('3204');
}

foreach($data as $row) {
    if (trim($row['kecamatan']) === 'KECAMATAN' || trim($row['kecamatan']) === '') continue;

    $kecamatanName = trim($row['kecamatan']);
    $puskesmasName = trim($row['puskesmas']);
    $desaName = trim($row['desa']);

    // Name fixups
    if ($kecamatanName === 'BANJARAN KOTA') $kecamatanName = 'BANJARAN';
    if ($kecamatanName === 'PASIR JAMBU') $kecamatanName = 'PASIRJAMBU';

    // Find District in Regency
    $district = District::where('regency_id', $regency->id)
        ->where(function($q) use ($kecamatanName) {
            $q->where('name', 'LIKE', '%' . $kecamatanName . '%')
              ->orWhereRaw("REPLACE(name, ' ', '') LIKE ?", ['%' . str_replace(' ', '', $kecamatanName) . '%']);
        })
        ->first();

    if (!$district) {
        echo "District not found: $kecamatanName\n";
        continue;
    }

    // Find Faskes
    $faskes = Faskes::where('type', 'PUSKESMAS')
        ->where('name', 'LIKE', '%' . $puskesmasName . '%')
        ->first();

    if (!$faskes) {
        echo "Faskes not found for Puskesmas: $puskesmasName\n";
        continue;
    }

    // Update Faskes District
    if ($faskes->district_id !== $district->id) {
        $faskes->district_id = $district->id;
        $faskes->district_name = $district->name;
        $faskes->regency_name = $regency->name;
        $faskes->save();
        if (!in_array($faskes->id, $faskesUpdated)) {
            $faskesUpdated[] = $faskes->id;
        }
    }

    // Find Village
    $village = Village::where('district_id', $district->id)
        ->where(function($q) use ($desaName) {
            $q->where('name', 'LIKE', '%' . $desaName . '%')
              ->orWhereRaw("REPLACE(name, ' ', '') LIKE ?", ['%' . str_replace(' ', '', $desaName) . '%']);
        })
        ->first();

    if ($village) {
        // Attach to faskes
        if (!$faskes->villages()->where('village_id', $village->id)->exists()) {
            $faskes->villages()->attach($village->id);
            $villagesAttached++;
            echo "Attached Village {$village->name} to Faskes {$faskes->name}\n";
        } else {
             // echo "Village {$village->name} already attached to Faskes {$faskes->name}\n";
        }
    } else {
        echo "Village not found: $desaName in District {$district->name} (Regency {$regency->name})\n";
    }
}

echo "Update complete.\n";
echo "Faskes updated (District assigned): " . count($faskesUpdated) . "\n";
echo "Villages attached to Faskes: $villagesAttached\n";
