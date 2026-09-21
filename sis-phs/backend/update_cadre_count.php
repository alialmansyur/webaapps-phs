<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Faskes;

$kaderCount = User::whereHas('role', function($q) {
    $q->where('code', 'kader');
})->count();

echo "Total Kader in DB: $kaderCount\n";

// Get kader count per Faskes
$faskesList = Faskes::all();
$updated = 0;
foreach ($faskesList as $faskes) {
    $count = User::whereHas('role', function($q) {
        $q->where('code', 'kader');
    })->where('puskesmas_id', $faskes->id)->count();
    
    // What if kader is only mapped by village_id?
    if ($count == 0 && $faskes->villages()->count() > 0) {
        $villageIds = $faskes->villages()->pluck('village_id')->toArray();
        $count = User::whereHas('role', function($q) {
            $q->where('code', 'kader');
        })->whereIn('village_id', $villageIds)->count();

        // Update the kader's puskesmas_id to this faskes so they are mapped correctly!
        if ($count > 0) {
            User::whereHas('role', function($q) {
                $q->where('code', 'kader');
            })->whereIn('village_id', $villageIds)->update(['puskesmas_id' => $faskes->id]);
            echo "Updated puskesmas_id for $count kaders to Faskes {$faskes->name}\n";
        }
    }

    if ($faskes->cadre_count !== $count) {
        $faskes->cadre_count = $count;
        $faskes->save();
        $updated++;
    }
}

echo "Faskes updated: $updated\n";
