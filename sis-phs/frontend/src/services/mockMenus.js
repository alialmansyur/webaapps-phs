export const MOCK_ROLE_MENUS = {
  kader: [
    { title: 'Dashboard Kader', path: '/kader/dashboard', icon: 'House' },
    {
      title: 'Operasional Survei',
      icon: 'ClipboardList',
      children: [
        { title: 'Mulai Survei Baru', path: '/kader/surveys/new' },
        { title: 'Draft Survei', path: '/kader/surveys/drafts' },
        { title: 'Riwayat Survei Saya', path: '/kader/surveys/history' },
      ],
    },
    {
      title: 'Tindak Lanjut',
      icon: 'HeartPulse',
      children: [
        { title: 'Jadwal Intervensi', path: '/kader/interventions/schedule' },
        { title: 'Log Edukasi', path: '/kader/interventions/log' },
      ],
    },
    {
      title: 'Profil & Sinkronisasi',
      icon: 'BadgeCheck',
      children: [
        { title: 'Wilayah Binaan', path: '/kader/profile/wilayah' },
        { title: 'Pengaturan Akun', path: '/kader/profile/account' },
      ],
    },
  ],
  puskesmas: [
    { title: 'Dashboard Puskesmas', path: '/puskesmas/dashboard', icon: 'LayoutDashboard' },
    {
      title: 'Operasional Survei',
      icon: 'ClipboardCheck',
      children: [
        { title: 'Verifikasi Data', path: '/puskesmas/surveys/verification' },
        { title: 'Pantauan Intervensi', path: '/puskesmas/interventions' },
      ],
    },
    {
      title: 'Laporan Wilayah',
      icon: 'FileSpreadsheet',
      children: [
        { title: 'Laporan Capaian Desa', path: '/puskesmas/reports/desa' },
      ],
    },
    {
      title: 'Manajemen Pengguna',
      icon: 'Users',
      children: [
        { title: 'Kader Wilayah', path: '/puskesmas/users/kader' },
      ],
    },
  ],
  dinkes: [
    { title: 'Dashboard Analytics', path: '/dinkes/dashboard', icon: 'ChartNoAxesCombined' },
    {
      title: 'Laporan Agregat',
      icon: 'FileBarChart2',
      children: [
        { title: 'Laporan Agregat Wilayah', path: '/dinkes/reports/aggregate' },
        { title: 'Ranking Puskesmas', path: '/dinkes/reports/rankings' },
      ],
    },
  ],
  admin: [
    {
      title: 'Dashboard',
      icon: 'PanelsTopLeft',
      children: [
        { title: 'Dashboard Admin', path: '/admin/dashboard' },
        { title: 'Dashboard Dinkes', path: '/dinkes/dashboard' },
        { title: 'Dashboard Puskesmas', path: '/puskesmas/dashboard' },
        { title: 'Dashboard Kader', path: '/kader/dashboard' },
      ],
    },
    {
      title: 'Survei',
      icon: 'ClipboardList',
      children: [
        { title: 'Validasi Data', path: '/admin/surveys/validation' },
        { title: 'Database Keluarga', path: '/admin/surveys/database' },
        { title: 'Mulai Survei Baru', path: '/kader/surveys/new' },
        { title: 'Draft Survei', path: '/kader/surveys/drafts' },
        { title: 'Riwayat Survei Saya', path: '/kader/surveys/history' },
      ],
    },
    {
      title: 'Intervensi',
      icon: 'HeartPulse',
      children: [
        { title: 'Monitoring Intervensi', path: '/admin/surveys/interventions' },
        { title: 'Jadwal Intervensi', path: '/kader/interventions/schedule' },
        { title: 'Log Edukasi', path: '/kader/interventions/log' },
      ],
    },
    {
      title: 'Laporan',
      icon: 'Files',
      children: [
        { title: 'Laporan Agregat Wilayah', path: '/dinkes/reports/aggregate' },
        { title: 'Laporan Capaian Desa', path: '/puskesmas/reports/desa' },
        { title: 'Progress & Coverage Survey', path: '/admin/reports/survey-progress' },
        { title: 'Capaian Indikator Survey', path: '/admin/reports/survey-indicators' },
        { title: 'Rekap PHBS Kabupaten', path: '/admin/reports/phs-kabupaten' },
        { title: 'Laporan IKS Wilayah', path: '/admin/reports/iks-wilayah' },
      ],
    },
    {
      title: 'Master Data',
      icon: 'Database',
      children: [
        { title: 'Master Wilayah', path: '/admin/master/regions' },
        { title: 'Fasilitas Kesehatan', path: '/admin/master/faskes' },
        { title: 'Kuesioner Survei', path: '/admin/master/questions' },
        { title: 'Algoritma Skoring', path: '/admin/master/scoring' },
      ],
    },
    {
      title: 'Manajemen Pengguna',
      icon: 'Users',
      children: [
        { title: 'Pengguna Kader', path: '/admin/users/kader' },
        { title: 'Admin Internal', path: '/admin/users/admin' },
      ],
    },
    {
      title: 'Profil & Sinkronisasi',
      icon: 'BadgeCheck',
      children: [
        { title: 'Wilayah Binaan', path: '/kader/profile/wilayah' },
        { title: 'Pengaturan Akun', path: '/kader/profile/account' },
      ],
    },
    {
      title: 'Pengaturan Sistem',
      icon: 'Settings2',
      children: [
        { title: 'Periode & Target Tahunan', path: '/admin/settings/periods' },
        { title: 'Manajemen Role & Menu', path: '/admin/settings/rbac' },
        { title: 'Audit Trail', path: '/admin/settings/audit' },
      ],
    },
  ],
}
