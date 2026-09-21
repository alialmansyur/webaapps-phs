<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$kaders = User::whereHas('role', function($q) { $q->where('code', 'kader'); })->whereNotNull('puskesmas_id')->pluck('puskesmas_id')->countBy()->toArray();

print_r($kaders);
