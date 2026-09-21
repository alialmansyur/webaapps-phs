<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['code' => 'admin', 'name' => 'Admin', 'description' => 'Akses penuh aplikasi'],
            ['code' => 'dinkes', 'name' => 'Dinas Kesehatan', 'description' => 'Monitoring lintas puskesmas'],
            ['code' => 'puskesmas', 'name' => 'Admin Puskesmas', 'description' => 'Operasional wilayah puskesmas'],
            ['code' => 'kader', 'name' => 'Surveyor / Kader', 'description' => 'Pengumpulan data lapangan'],
            ['code' => 'auditor', 'name' => 'Auditor Internal', 'description' => 'Audit akses dan perubahan'],
            ['code' => 'analis', 'name' => 'Analis Data', 'description' => 'Analisis dan pelaporan'],
        ];

        foreach ($roles as $role) {
            Role::query()->updateOrCreate(['code' => $role['code']], $role + ['is_active' => true]);
        }

        $menuGroups = [
            [
                'code' => 'group-dashboard',
                'title' => 'Dashboard',
                'sort_order' => 10,
                'context_group' => 'dashboard',
                'children' => [
                    ['code' => 'kader-dashboard', 'title' => 'Dashboard Kader', 'path' => '/kader/dashboard', 'sort_order' => 1],
                    ['code' => 'puskesmas-dashboard', 'title' => 'Dashboard Puskesmas', 'path' => '/puskesmas/dashboard', 'sort_order' => 2],
                    ['code' => 'dinkes-dashboard', 'title' => 'Dashboard Analytics', 'path' => '/dinkes/dashboard', 'sort_order' => 3],
                    ['code' => 'admin-dashboard', 'title' => 'Dashboard Admin', 'path' => '/admin/dashboard', 'sort_order' => 4],
                ],
            ],
            [
                'code' => 'group-surveys',
                'title' => 'Survei',
                'sort_order' => 20,
                'context_group' => 'surveys',
                'children' => [
                    ['code' => 'kader-surveys-new', 'title' => 'Mulai Survei Baru', 'path' => '/kader/surveys/new', 'sort_order' => 1],
                    ['code' => 'kader-surveys-drafts', 'title' => 'Draft Survei', 'path' => '/kader/surveys/drafts', 'sort_order' => 2],
                    ['code' => 'kader-surveys-history', 'title' => 'Riwayat Survei Saya', 'path' => '/kader/surveys/history', 'sort_order' => 3],
                    ['code' => 'puskesmas-surveys-verification', 'title' => 'Verifikasi Data', 'path' => '/puskesmas/surveys/verification', 'sort_order' => 4],
                    ['code' => 'admin-surveys-validation', 'title' => 'Validasi Data', 'path' => '/admin/surveys/validation', 'sort_order' => 5],
                    ['code' => 'admin-surveys-database', 'title' => 'Database Keluarga', 'path' => '/admin/surveys/database', 'sort_order' => 6],
                ],
            ],
            [
                'code' => 'group-interventions',
                'title' => 'Intervensi',
                'sort_order' => 30,
                'context_group' => 'interventions',
                'children' => [
                    ['code' => 'kader-interventions-schedule', 'title' => 'Jadwal Intervensi', 'path' => '/kader/interventions/schedule', 'sort_order' => 1],
                    ['code' => 'kader-interventions-log', 'title' => 'Log Edukasi', 'path' => '/kader/interventions/log', 'sort_order' => 2],
                    ['code' => 'puskesmas-interventions-monitoring', 'title' => 'Pantauan Intervensi', 'path' => '/puskesmas/interventions', 'sort_order' => 3],
                    ['code' => 'admin-interventions-monitoring', 'title' => 'Monitoring Intervensi', 'path' => '/admin/surveys/interventions', 'sort_order' => 4],
                ],
            ],
            [
                'code' => 'group-reports',
                'title' => 'Laporan',
                'sort_order' => 40,
                'context_group' => 'reports',
                'children' => [
                    ['code' => 'puskesmas-reports-desa', 'title' => 'Laporan Capaian Desa', 'path' => '/puskesmas/reports/desa', 'sort_order' => 1],
                    ['code' => 'dinkes-reports-aggregate', 'title' => 'Laporan Agregat Wilayah', 'path' => '/dinkes/reports/aggregate', 'sort_order' => 2],
                    ['code' => 'dinkes-reports-rankings', 'title' => 'Ranking Puskesmas', 'path' => '/dinkes/reports/rankings', 'sort_order' => 3],
                    ['code' => 'admin-reports-survey-progress', 'title' => 'Progress & Coverage Survey', 'path' => '/admin/reports/survey-progress', 'sort_order' => 4],
                    ['code' => 'admin-reports-survey-indicators', 'title' => 'Capaian Indikator Survey', 'path' => '/admin/reports/survey-indicators', 'sort_order' => 5],
                    ['code' => 'admin-reports-phs-kabupaten', 'title' => 'Rekap PHBS Kabupaten', 'path' => '/admin/reports/phs-kabupaten', 'sort_order' => 6],
                    ['code' => 'admin-reports-iks-wilayah', 'title' => 'Laporan IKS Wilayah', 'path' => '/admin/reports/iks-wilayah', 'sort_order' => 7],
                ],
            ],
            [
                'code' => 'group-master-data',
                'title' => 'Master Data',
                'sort_order' => 50,
                'context_group' => 'master',
                'children' => [
                    ['code' => 'admin-master-regions', 'title' => 'Master Wilayah', 'path' => '/admin/master/regions', 'sort_order' => 1],
                    ['code' => 'admin-master-faskes', 'title' => 'Fasilitas Kesehatan', 'path' => '/admin/master/faskes', 'sort_order' => 2],
                    ['code' => 'admin-master-questions', 'title' => 'Kuesioner Survei', 'path' => '/admin/master/questions', 'sort_order' => 3],
                    ['code' => 'admin-master-scoring', 'title' => 'Algoritma Skoring', 'path' => '/admin/master/scoring', 'sort_order' => 4],
                ],
            ],
            [
                'code' => 'group-users',
                'title' => 'Manajemen Pengguna',
                'sort_order' => 60,
                'context_group' => 'users',
                'children' => [
                    ['code' => 'puskesmas-users-kader', 'title' => 'Kader Wilayah', 'path' => '/puskesmas/users/kader', 'sort_order' => 1],
                    ['code' => 'admin-users-kader', 'title' => 'Pengguna Kader', 'path' => '/admin/users/kader', 'sort_order' => 2],
                    ['code' => 'admin-users-admin', 'title' => 'Admin Internal', 'path' => '/admin/users/admin', 'sort_order' => 3],
                ],
            ],
            [
                'code' => 'group-profile',
                'title' => 'Profil & Sinkronisasi',
                'sort_order' => 70,
                'context_group' => 'profile',
                'children' => [
                    ['code' => 'kader-profile-wilayah', 'title' => 'Wilayah Binaan', 'path' => '/kader/profile/wilayah', 'sort_order' => 1],
                    ['code' => 'kader-profile-account', 'title' => 'Pengaturan Akun', 'path' => '/kader/profile/account', 'sort_order' => 2],
                ],
            ],
            [
                'code' => 'group-settings',
                'title' => 'Pengaturan Sistem',
                'sort_order' => 80,
                'context_group' => 'settings',
                'children' => [
                    ['code' => 'admin-settings-periods', 'title' => 'Periode & Target Tahunan', 'path' => '/admin/settings/periods', 'sort_order' => 1],
                    ['code' => 'admin-settings-rbac', 'title' => 'Manajemen Role & Menu', 'path' => '/admin/settings/rbac', 'sort_order' => 2],
                    ['code' => 'admin-settings-audit', 'title' => 'Audit Trail', 'path' => '/admin/settings/audit', 'sort_order' => 3],
                ],
            ],
        ];

        foreach ($menuGroups as $group) {
            $parent = Menu::query()->updateOrCreate(
                ['code' => $group['code']],
                [
                    'parent_id' => null,
                    'title' => $group['title'],
                    'path' => null,
                    'sort_order' => $group['sort_order'],
                    'is_active' => true,
                    'context_group' => $group['context_group'],
                ]
            );

            foreach ($group['children'] as $child) {
                Menu::query()->updateOrCreate(
                    ['code' => $child['code']],
                    [
                        'parent_id' => $parent->id,
                        'title' => $child['title'],
                        'path' => $child['path'],
                        'sort_order' => $child['sort_order'],
                        'is_active' => true,
                        'context_group' => $group['context_group'],
                    ]
                );
            }
        }

        $roleMenuMap = [
            'admin' => [
                'kader-dashboard',
                'puskesmas-dashboard',
                'dinkes-dashboard',
                'admin-dashboard',
                'kader-surveys-new',
                'kader-surveys-drafts',
                'kader-surveys-history',
                'puskesmas-surveys-verification',
                'admin-surveys-validation',
                'admin-surveys-database',
                'kader-interventions-schedule',
                'kader-interventions-log',
                'puskesmas-interventions-monitoring',
                'admin-interventions-monitoring',
                'puskesmas-reports-desa',
                'dinkes-reports-aggregate',
                'dinkes-reports-rankings',
                'admin-reports-survey-progress',
                'admin-reports-survey-indicators',
                'admin-reports-phs-kabupaten',
                'admin-reports-iks-wilayah',
                'admin-master-regions',
                'admin-master-faskes',
                'admin-master-questions',
                'admin-master-scoring',
                'puskesmas-users-kader',
                'admin-users-kader',
                'admin-users-admin',
                'kader-profile-wilayah',
                'kader-profile-account',
                'admin-settings-periods',
                'admin-settings-rbac',
                'admin-settings-audit',
            ],
            'dinkes' => [
                'dinkes-dashboard',
                'dinkes-reports-aggregate',
                'dinkes-reports-rankings',
                'admin-settings-periods',
                'admin-master-regions',
            ],
            'puskesmas' => [
                'puskesmas-dashboard',
                'puskesmas-surveys-verification',
                'puskesmas-interventions-monitoring',
                'puskesmas-reports-desa',
                'puskesmas-users-kader',
                'admin-settings-periods',
                'admin-master-regions',
            ],
            'kader' => [
                'kader-dashboard',
                'kader-surveys-new',
                'kader-surveys-drafts',
                'kader-surveys-history',
                'kader-interventions-schedule',
                'kader-interventions-log',
                'kader-profile-wilayah',
                'kader-profile-account',
            ],
            'auditor' => [
                'admin-settings-audit',
            ],
            'analis' => [
                'dinkes-dashboard',
                'dinkes-reports-aggregate',
                'dinkes-reports-rankings',
                'admin-reports-survey-progress',
                'admin-reports-survey-indicators',
                'admin-reports-phs-kabupaten',
                'admin-reports-iks-wilayah',
            ],
        ];

        foreach ($roleMenuMap as $roleCode => $menuCodes) {
            $role = Role::query()->where('code', $roleCode)->first();
            if (! $role) {
                continue;
            }

            $role->menus()->sync(Menu::query()->whereIn('code', $menuCodes)->pluck('id')->all());
        }
    }
}
