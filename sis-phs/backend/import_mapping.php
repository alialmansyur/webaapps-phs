<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Faskes;
use App\Models\Puskesmas;
use App\Models\District;
use App\Models\Village;
use Illuminate\Support\Str;

$json = file_get_contents(__DIR__ . '/mapping2.json');
$data = json_decode($json, true);

$faskesUpdated = [];
$villagesAttached = 0;

foreach($data as $row) {
    if (trim($row['kecamatan']) === 'KECAMATAN' || trim($row['kecamatan']) === '') continue;

    $kecamatanName = trim($row['kecamatan']);
    $puskesmasName = trim($row['puskesmas']);
    $desaName = trim($row['desa']);

    // Find District
    $district = District::where('name', 'LIKE', '%' . $kecamatanName . '%')->first();
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
        // we can also set regency_name if not set, let's assume it's BANDUNG
        $faskes->save();
        if (!in_array($faskes->id, $faskesUpdated)) {
            $faskesUpdated[] = $faskes->id;
        }
    }

    // Find Village
    $village = Village::where('district_id', $district->id)
        ->where('name', 'LIKE', '%' . $desaName . '%')
        ->first();

    if ($village) {
        // Attach to faskes
        if (!$faskes->villages()->where('village_id', $village->id)->exists()) {
            $faskes->villages()->attach($village->id);
            $villagesAttached++;
            echo "Attached Village {$village->name} to Faskes {$faskes->name}\n";
        }
    } else {
        echo "Village not found: $desaName in District $kecamatanName\n";
    }
}

echo "Update complete.\n";
echo "Faskes updated (District assigned): " . count($faskesUpdated) . "\n";
echo "Villages attached to Faskes: $villagesAttached\n";
