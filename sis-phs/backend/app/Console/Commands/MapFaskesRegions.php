<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class MapFaskesRegions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'phs:map-regions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Map Puskesmas, Kecamatan, and Villages from mapping JSON, then update Users puskesmas_id';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = storage_path('app/phs_mapping.json');

        if (!file_exists($path)) {
            $this->error("File not found at $path");
            return;
        }

        $data = json_decode(file_get_contents($path), true);
        if (!$data) {
            $this->error("Invalid JSON data.");
            return;
        }

        $this->info("Processing " . count($data) . " mappings.");

        DB::beginTransaction();

        try {
            $faskesCount = 0;
            $mappingCount = 0;

            foreach ($data as $row) {
                $kecamatan = $row['kecamatan'];
                $puskesmasName = $row['puskesmas'];
                $desaName = $row['desa'];

                if (!$kecamatan || !$puskesmasName || !$desaName) {
                    continue; // Skip incomplete data
                }

                // 1. Find District (Kab Bandung = 3204)
                $district = DB::table('reg_districts')
                    ->where('regency_id', '3204')
                    ->where('name', 'like', '%' . $kecamatan . '%')
                    ->first();

                if (!$district) {
                    $this->warn("District not found: $kecamatan");
                    continue;
                }

                // 2. Find Village
                $villageClean = trim(str_replace(['Desa ', 'Kelurahan '], '', $desaName));
                $village = DB::table('reg_villages')
                    ->where('district_id', $district->id)
                    ->where('name', 'like', '%' . $villageClean . '%')
                    ->first();

                if (!$village) {
                    $this->warn("Village not found: $desaName in $kecamatan");
                    continue;
                }

                // 3. Find or Create Faskes (Puskesmas)
                $fullName = "Puskesmas " . $puskesmasName;
                $faskes = DB::table('mstr_faskes')->where('name', $fullName)->first();

                if (!$faskes) {
                    $faskesId = DB::table('mstr_faskes')->insertGetId([
                        'code' => 'PKM-' . strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $puskesmasName)),
                        'name' => $fullName,
                        'type' => 'PUSKESMAS',
                        'phone' => null,
                        'address' => null,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    $faskes = DB::table('mstr_faskes')->where('id', $faskesId)->first();
                    $faskesCount++;
                }

                // 4. Map Faskes to Village
                $exists = DB::table('mstr_faskes_villages')
                    ->where('faskes_id', $faskes->id)
                    ->where('village_id', $village->id)
                    ->exists();

                if (!$exists) {
                    DB::table('mstr_faskes_villages')->insert([
                        'faskes_id' => $faskes->id,
                        'village_id' => $village->id,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    $mappingCount++;
                }
            }

            $this->info("Created $faskesCount Puskesmas and $mappingCount village mappings.");

            // 5. Update Users puskesmas_id
            $this->info("Updating users puskesmas_id...");
            $updatedUsers = 0;

            // Get all faskes-village mappings
            $faskesVillages = DB::table('mstr_faskes_villages')->get();
            $villageToFaskes = [];
            foreach ($faskesVillages as $fv) {
                $villageToFaskes[$fv->village_id] = $fv->faskes_id;
            }

            // Update users missing puskesmas_id
            $users = DB::table('users')->whereNull('puskesmas_id')->whereNotNull('village_id')->get();

            foreach ($users as $user) {
                if (isset($villageToFaskes[$user->village_id])) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['puskesmas_id' => $villageToFaskes[$user->village_id]]);
                    $updatedUsers++;
                }
            }

            $this->info("Successfully updated puskesmas_id for $updatedUsers users.");

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("An error occurred: " . $e->getMessage() . " at line " . $e->getLine());
        }
    }
}
