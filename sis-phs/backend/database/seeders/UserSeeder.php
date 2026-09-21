<?php

namespace Database\Seeders;

use App\Models\DinkesPuskesmas;
use App\Models\Puskesmas;
use App\Models\Role;
use App\Models\User;
use App\Models\UserScope;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $roles = Role::query()->pluck('id', 'code');
        $sukamaju = Puskesmas::query()->where('code', 'PKM-SKM')->first();
        $harapan = Puskesmas::query()->where('code', 'PKM-HRP')->first();

        if (! $sukamaju || ! $harapan) {
            return;
        }

        $users = [
            [
                'username' => 'admin',
                'full_name' => 'Admin SIS-PHS',
                'email' => 'admin@sisphs.test',
                'phone' => '081234560001',
                'password' => 'admin12345',
                'role_id' => $roles['admin'],
                'district_id' => '3201010',
            ],
            [
                'username' => 'dinkes',
                'full_name' => 'Tim Dinkes Kabupaten',
                'email' => 'dinkes@sisphs.test',
                'phone' => '081234560002',
                'password' => 'dinkes12345',
                'role_id' => $roles['dinkes'],
                'district_id' => '3201010',
            ],
            [
                'username' => 'puskesmas',
                'full_name' => 'dr. Rina Puskesmas',
                'email' => 'puskesmas@sisphs.test',
                'phone' => '081234560003',
                'password' => 'puskesmas12345',
                'role_id' => $roles['puskesmas'],
                'district_id' => '3201010',
                'puskesmas_id' => $sukamaju->id,
            ],
            [
                'username' => 'kader',
                'full_name' => 'Budi Kurniawan',
                'email' => 'kader@sisphs.test',
                'phone' => '081234560004',
                'password' => 'kader12345',
                'role_id' => $roles['kader'],
                'district_id' => '3201010',
                'puskesmas_id' => $sukamaju->id,
                'village_id' => '3201010001',
                'kader_code' => 'KDR-001',
                'coverage_area' => 'RT 01-04',
            ],
            [
                'username' => 'kader.harapan',
                'full_name' => 'Siti Aminah',
                'email' => 'kader.harapan@sisphs.test',
                'phone' => '081234560005',
                'password' => 'kaderharapan12345',
                'role_id' => $roles['kader'],
                'district_id' => '3201011',
                'puskesmas_id' => $harapan->id,
                'village_id' => '3201011001',
                'kader_code' => 'KDR-002',
                'coverage_area' => 'RT 02-05',
            ],
        ];

        foreach ($users as $data) {
            $user = User::query()->updateOrCreate(
                ['username' => $data['username']],
                [
                    'name' => $data['full_name'],
                    'full_name' => $data['full_name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'password' => $data['password'],
                    'role_id' => $data['role_id'],
                    'district_id' => $data['district_id'] ?? null,
                    'puskesmas_id' => $data['puskesmas_id'] ?? null,
                    'village_id' => $data['village_id'] ?? null,
                    'kader_code' => $data['kader_code'] ?? null,
                    'coverage_area' => $data['coverage_area'] ?? null,
                    'is_active' => true,
                    'must_reset_password' => false,
                    'last_login_at' => now()->subHours(rand(1, 24)),
                ]
            );

            UserScope::query()->updateOrCreate(
                ['user_id' => $user->id, 'scope_type' => $user->role->code],
                [
                    'district_id' => $user->district_id,
                    'puskesmas_id' => $user->puskesmas_id,
                    'village_id' => $user->village_id,
                    'is_primary' => true,
                ]
            );
        }

        $dinkes = User::query()->where('username', 'dinkes')->firstOrFail();
        DinkesPuskesmas::query()->updateOrCreate(['dinkes_user_id' => $dinkes->id, 'puskesmas_id' => $sukamaju->id]);
        DinkesPuskesmas::query()->updateOrCreate(['dinkes_user_id' => $dinkes->id, 'puskesmas_id' => $harapan->id]);
    }
}
