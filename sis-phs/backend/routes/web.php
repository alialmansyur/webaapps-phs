<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});



Route::get('/export-users-temp', function() {
    $users = \App\Models\User::with(['role', 'puskesmas', 'village', 'district'])->get();
    $fp = fopen(public_path('seluruh_data_login.csv'), 'w');
    fputcsv($fp, ['Kategori/Role', 'Nama Pengguna', 'Username', 'Email', 'No. HP', 'Kecamatan', 'Puskesmas', 'Desa/Kelurahan', 'Password']);

    foreach ($users as $u) {
        $pwdHint = 'admin12345';
        if (str_contains(strtolower($u->role?->code ?? ''), 'dinkes')) $pwdHint = 'dinkes12345';
        if (str_contains(strtolower($u->role?->code ?? ''), 'puskesmas')) $pwdHint = 'puskesmas12345';
        if (str_contains(strtolower($u->role?->code ?? ''), 'kader')) $pwdHint = 'kader12345 / kaderharapan12345';

        fputcsv($fp, [
            $u->role?->name ?? '-',
            $u->full_name,
            $u->username,
            $u->email,
            $u->phone ?? '-',
            $u->district?->name ?? '-',
            $u->puskesmas?->name ?? '-',
            $u->village?->name ?? '-',
            $pwdHint
        ]);
    }
    fclose($fp);
    return "Exported";
});


