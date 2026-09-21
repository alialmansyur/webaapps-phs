export const getNavItems = (roleRaw) => {
  const role = String(roleRaw || '').toLowerCase();
  
  if (role === 'kader') {
    return [
      {
        id: 'surveyor-dashboard',
        label: 'Beranda',
        href: '/surveyor',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
      {
        id: 'keluarga-sehat',
        label: 'Keluarga Sehat',
        href: '/surveyor/keluarga',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        children: [
          { id: 'ks-baru', label: 'Mulai Survei Baru', href: '/surveyor/wizard' },
          { id: 'ks-draft', label: 'Draft Survei', href: '/surveyor/draft' },
          { id: 'ks-riwayat', label: 'Riwayat Terkirim', href: '/surveyor/history' },
        ]
      },
      {
        id: 'tindak-lanjut',
        label: 'Tindak Lanjut',
        href: '/surveyor/intervensi',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        children: [
          { id: 'tl-jadwal', label: 'Jadwal Intervensi', href: '/surveyor/intervensi/jadwal' },
          { id: 'tl-log', label: 'Log Edukasi', href: '/surveyor/intervensi/log' },
        ]
      },
      {
        id: 'profil-sistem',
        label: 'Profil & Sistem',
        href: '/surveyor/system',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        children: [
          { id: 'sys-wilayah', label: 'Wilayah Binaan', href: '/surveyor/wilayah-binaan' },
          { id: 'sys-profil', label: 'Pengaturan Akun', href: '/surveyor/profil' },
        ]
      }
    ];
  }

  // Admin/Dinkes
  return [
    {
      id: 'admin-dashboard',
      label: 'Executive Dashboard',
      href: '/admin/dashboard',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      children: [
        { id: 'dash-map', label: 'Pemetaan IKS', href: '/admin' },
        { id: 'dash-kpi', label: 'Capaian Indikator', href: '/admin/analytics/kpi' },
      ]
    },
    {
      id: 'admin-surveys',
      label: 'Manajemen Survei',
      href: '/admin/surveys',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      children: [
        { id: 'srv-val', label: 'Validasi Data', href: '/admin/surveys/validation' },
        { id: 'srv-db', label: 'Database Keluarga', href: '/admin/surveys/database' },
        { id: 'srv-int', label: 'Monitoring Intervensi', href: '/admin/surveys/interventions' },
      ]
    },
    {
      id: 'admin-master',
      label: 'Master Data',
      href: '/admin/master',
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
      children: [
        { id: 'mst-ques', label: 'Kuesioner Survei', href: '/admin/master/questions' },
        { id: 'mst-score', label: 'Algoritma Skoring', href: '/admin/master/scoring' },
        { id: 'mst-reg', label: 'Wilayah Administrasi', href: '/admin/master/regions' },
        { id: 'mst-fas', label: 'Fasilitas Kesehatan', href: '/admin/master/faskes' },
      ]
    },
    {
      id: 'admin-users',
      label: 'Manajemen Pengguna',
      href: '/admin/users',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      children: [
        { id: 'usr-kader', label: 'Direktori Kader', href: '/admin/users/kader' },
        { id: 'usr-admin', label: 'Admin Internal', href: '/admin/users/admin' },
      ]
    },
    {
      id: 'admin-reports',
      label: 'Laporan Survey',
      href: '/admin/reports',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      children: [
        { id: 'rpt-progress', label: 'Progress & Coverage Survey', href: '/admin/reports/survey-progress' },
        { id: 'rpt-indicator', label: 'Capaian Indikator Survey', href: '/admin/reports/survey-indicators' },
        { id: 'rpt-phs-kab', label: 'Rekap PHBS Kabupaten', href: '/admin/reports/phs-kabupaten' },
        { id: 'rpt-iks', label: 'Laporan IKS Wilayah', href: '/admin/reports/iks-wilayah' },
      ]
    },
    {
      id: 'admin-settings',
      label: 'Sistem & Keamanan',
      href: '/admin/settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      children: [
        { id: 'set-gen', label: 'Pengaturan Aplikasi', href: '/admin/settings/general' },
        { id: 'set-audit', label: 'Audit Trail', href: '/admin/settings/audit' },
      ]
    }
  ];
};

export const NAV_ITEMS = [];
