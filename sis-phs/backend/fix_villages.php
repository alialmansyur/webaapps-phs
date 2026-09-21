<?php

use Illuminate\Support\Facades\DB;

$kaders = DB::table('users')
    ->where('created_at', '>', '2026-06-12 04:00:00')
    ->whereNull('puskesmas_id')
    ->get();

$data = json_decode(file_get_contents(storage_path('app/phs_data.json')), true);
$mappings = json_decode(file_get_contents(storage_path('app/phs_mapping.json')), true);

$fixedCount = 0;

foreach ($kaders as $kader) {
    // Find kader's row in phs_data.json
    $row = null;
    foreach ($data as $r) {
        if (trim($r['Nama Kader']) == $kader->name || trim($r['Nama Kader']) == $kader->full_name) {
            $row = $r;
            break;
        }
    }

    if (!$row) continue;

    $desaRaw = $row['Desa yang diperiksa'];
    $desaClean = trim(str_replace(['Desa ', 'Kelurahan '], '', $desaRaw));

    // Find the district from phs_mapping
    $kecamatan = null;
    foreach ($mappings as $map) {
        if (strtolower($map['desa']) == strtolower($desaClean)) {
            $kecamatan = $map['kecamatan'];
            break;
        }
    }

    if (!$kecamatan) {
        echo "Kecamatan not found for $desaClean\n";
        continue;
    }

    // Find district in DB
    $district = DB::table('reg_districts')
        ->where('regency_id', '3204')
        ->where('name', 'like', '%' . $kecamatan . '%')
        ->first();

    if (!$district) continue;

    // Find exact village
    $village = DB::table('reg_villages')
        ->where('district_id', $district->id)
        ->where('name', 'like', '%' . $desaClean . '%')
        ->first();

    if ($village) {
        // Update User
        DB::table('users')->where('id', $kader->id)->update([
            'village_id' => $village->id,
            'district_id' => $district->id
        ]);
        
        // Find mstr_faskes_villages relation to set puskesmas_id
        $fv = DB::table('mstr_faskes_villages')->where('village_id', $village->id)->first();
        if ($fv) {
            DB::table('users')->where('id', $kader->id)->update([
                'puskesmas_id' => $fv->faskes_id
            ]);
        }

        // Also update Households that belong to this Kader's wrong village and created recently
        // But households belong to village, not kader directly.
        // Wait, the surveys link kader and respondent, and respondent links household.
        // We can just update households that have the same wrong village_id and were created today.
        $old_village_id = $kader->village_id;
        DB::table('mstr_households')
            ->where('village_id', $old_village_id)
            ->where('created_at', '>', '2026-06-12 04:00:00')
            ->update([
                'village_id' => $village->id
            ]);

        $fixedCount++;
        echo "Fixed Kader: {$kader->name} -> Village: {$village->name} (District: {$district->name})\n";
    }
}

echo "Total Fixed: $fixedCount\n";

