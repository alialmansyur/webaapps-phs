<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$kaderWithPuskesmas = User::whereHas('role', function($q) { $q->where('code', 'kader'); })->whereNotNull('puskesmas_id')->count();
$kaderWithVillage = User::whereHas('role', function($q) { $q->where('code', 'kader'); })->whereNotNull('village_id')->count();
$kaderWithDistrict = User::whereHas('role', function($q) { $q->where('code', 'kader'); })->whereNotNull('district_id')->count();

echo "Kader with puskesmas: $kaderWithPuskesmas\n";
echo "Kader with village: $kaderWithVillage\n";
echo "Kader with district: $kaderWithDistrict\n";
