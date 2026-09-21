<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Role;
use App\Models\Faskes;
use App\Models\UserScope;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

$role = Role::where('code', 'puskesmas')->first();
if (!$role) {
    echo "Role 'puskesmas' not found.\n";
    exit(1);
}

$puskesmasList = Faskes::where('type', 'PUSKESMAS')->get();
$created = 0;

foreach ($puskesmasList as $pkm) {
    $username = Str::slug($pkm->name);
    if (User::where('username', $username)->exists()) {
        continue;
    }

    $user = new User();
    $user->name = 'Admin ' . $pkm->name;
    $user->full_name = 'Administrator ' . $pkm->name;
    $user->username = $username;
    $user->email = $username . '@sisphs.local';
    $user->password = Hash::make('puskesmas123');
    $user->role_id = $role->id;
    $user->puskesmas_id = $pkm->id;
    $user->district_id = $pkm->district_id;
    $user->is_active = true;
    $user->save();

    UserScope::create([
        'user_id' => $user->id,
        'scope_type' => 'puskesmas',
        'puskesmas_id' => $pkm->id,
        'district_id' => $pkm->district_id,
        'is_primary' => true,
    ]);

    $created++;
}

echo "Created $created users for Puskesmas.\n";
