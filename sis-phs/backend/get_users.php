<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$pass = Hash::make('password123');

$kader = DB::table('users')
    ->join('roles', 'users.role_id', '=', 'roles.id')
    ->join('summary_surveys', 'users.id', '=', 'summary_surveys.surveyor_user_id')
    ->select('users.id', 'users.username')
    ->where('roles.name', 'Surveyor / Kader')
    ->first();

if ($kader) DB::table('users')->where('id', $kader->id)->update(['password' => $pass]);

$pkm = DB::table('users')
    ->join('roles', 'users.role_id', '=', 'roles.id')
    ->select('users.id', 'users.username')
    ->where('roles.name', 'Admin Puskesmas')
    ->first();

if ($pkm) DB::table('users')->where('id', $pkm->id)->update(['password' => $pass]);

$dinkes = DB::table('users')
    ->join('roles', 'users.role_id', '=', 'roles.id')
    ->select('users.id', 'users.username')
    ->where('roles.name', 'Dinas Kesehatan')
    ->first();

if (!$dinkes) {
    $dinkes = DB::table('users')
        ->join('roles', 'users.role_id', '=', 'roles.id')
        ->select('users.id', 'users.username')
        ->where('roles.name', 'Admin')
        ->first();
}

if ($dinkes) DB::table('users')->where('id', $dinkes->id)->update(['password' => $pass]);

echo "KADER: " . ($kader->username ?? 'Not found') . "\n";
echo "PUSKESMAS: " . ($pkm->username ?? 'Not found') . "\n";
echo "DINKES/ADMIN: " . ($dinkes->username ?? 'Not found') . "\n";
