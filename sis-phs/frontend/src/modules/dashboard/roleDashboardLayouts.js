export const dashboardStatusTone = (value) => {
  const text = String(value || '').toLowerCase()
  if (text.includes('baik') || text.includes('on track') || text.includes('aman') || text.includes('selesai')) return 'success'
  if (text.includes('pantau') || text.includes('stabil') || text.includes('draft')) return 'info'
  if (text.includes('prioritas') || text.includes('atensi') || text.includes('intervensi')) return 'warning'
  return 'danger'
}

export const kaderDashboardLayout = {
  filters: [
    { value: 'week', label: 'Minggu Ini' },
    { value: 'month', label: 'Bulan Ini' },
  ],
  dataByFilter: {
    week: {
      greeting: 'Rina Kurnia',
      subtitle: 'Fokus utama minggu ini adalah menutup target pengisian, menyelesaikan draft, dan memastikan follow-up keluarga prioritas tidak tertinggal.',
      progress: { label: 'Target pengisian mingguan', value: 80, note: '24 dari 30 keluarga sudah selesai diinput' },
      heroStats: [
        { label: 'Input selesai', value: '24 keluarga' },
        { label: 'Draft aktif', value: '2 form' },
        { label: 'Reminder hari ini', value: '3 agenda' },
      ],
      cards: [
        { label: 'Target Harian', value: '5 keluarga', subtitle: '3 sudah selesai hari ini', color: 'teal' },
        { label: 'Progress Mingguan', value: '80%', subtitle: 'Masih on track terhadap target', color: 'blue' },
        { label: 'Draft Belum Final', value: '2', subtitle: 'Perlu diselesaikan sebelum sinkron', color: 'amber' },
        { label: 'Follow-up Aktif', value: '1', subtitle: 'Keluarga prioritas perlu kunjungan ulang', color: 'rose' },
      ],
      reminders: [
        { title: 'Selesaikan draft Budi Santoso', time: '10:30', status: 'Prioritas', description: 'Progress sudah 78% dan tinggal validasi akhir jawaban keluarga.' },
        { title: 'Kunjungan follow-up Agus Salim', time: '13:00', status: 'Atensi', description: 'Verifikasi indikator merokok dalam rumah dan catat hasil edukasi.' },
        { title: 'Sinkronisasi sebelum pulang', time: '16:00', status: 'Penting', description: 'Pastikan semua form hari ini terkirim saat koneksi stabil.' },
      ],
      trend: {
        title: 'Tren Pengisian Harian',
        categories: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
        series: [
          { name: 'Target', data: [5, 5, 5, 5, 5, 3, 2] },
          { name: 'Tercapai', data: [3, 4, 5, 3, 4, 3, 2] },
        ],
      },
      donut: {
        title: 'Komposisi Aktivitas',
        labels: ['Selesai', 'Draft', 'Follow-up'],
        series: [62, 23, 15],
      },
      families: {
        title: 'Keluarga Dalam Proses',
        rows: [
          { keluarga: 'Budi Santoso', alamat: 'RT 01 / RW 02', progress: '78%', status: 'Draft' },
          { keluarga: 'Siti Aminah', alamat: 'RT 03 / RW 02', progress: '42%', status: 'Draft' },
          { keluarga: 'Agus Salim', alamat: 'RT 04 / RW 02', progress: 'Follow-up', status: 'Intervensi' },
          { keluarga: 'Wati Nurhayati', alamat: 'RT 02 / RW 03', progress: '100%', status: 'Selesai' },
        ],
      },
    },
    month: {
      greeting: 'Rina Kurnia',
      subtitle: 'Dashboard ini memantau ritme pengisian bulanan agar target keluarga binaan tetap tercapai sambil menjaga draft dan follow-up tetap terkendali.',
      progress: { label: 'Target pengisian bulanan', value: 86, note: '120 dari 140 keluarga sudah selesai diinput' },
      heroStats: [
        { label: 'Input selesai', value: '120 keluarga' },
        { label: 'Draft aktif', value: '5 form' },
        { label: 'Reminder bulan ini', value: '9 follow-up' },
      ],
      cards: [
        { label: 'Target Bulanan', value: '140 keluarga', subtitle: 'Masih realistis untuk tercapai', color: 'teal' },
        { label: 'Progress Bulanan', value: '86%', subtitle: 'Performa lapangan tetap stabil', color: 'blue' },
        { label: 'Draft Belum Final', value: '5', subtitle: 'Tersebar di 3 RT', color: 'amber' },
        { label: 'Follow-up Aktif', value: '9', subtitle: 'Perlu pengaturan jadwal berulang', color: 'rose' },
      ],
      reminders: [
        { title: 'Tutup draft lintas RT', time: 'Minggu ini', status: 'Prioritas', description: 'Rapikan 5 draft aktif agar tidak menumpuk menjelang akhir bulan.' },
        { title: 'Atur ulang keluarga follow-up', time: '2 hari lagi', status: 'Pantau', description: 'Fokuskan pada keluarga dengan status intervensi yang sudah terbuka lebih dari satu minggu.' },
        { title: 'Review target akhir bulan', time: 'Akhir pekan', status: 'Penting', description: 'Pastikan gap 20 keluarga bisa dikejar dengan distribusi waktu kunjungan yang sehat.' },
      ],
      trend: {
        title: 'Tren Pengisian Mingguan',
        categories: ['M1', 'M2', 'M3', 'M4'],
        series: [
          { name: 'Target', data: [30, 35, 35, 40] },
          { name: 'Tercapai', data: [26, 31, 33, 30] },
        ],
      },
      donut: {
        title: 'Komposisi Aktivitas',
        labels: ['Selesai', 'Draft', 'Follow-up'],
        series: [70, 18, 12],
      },
      families: {
        title: 'Keluarga Dalam Proses',
        rows: [
          { keluarga: 'Budi Santoso', alamat: 'RT 01 / RW 02', progress: '78%', status: 'Draft' },
          { keluarga: 'Siti Aminah', alamat: 'RT 03 / RW 02', progress: '42%', status: 'Draft' },
          { keluarga: 'Agus Salim', alamat: 'RT 04 / RW 02', progress: 'Follow-up', status: 'Intervensi' },
          { keluarga: 'Wati Nurhayati', alamat: 'RT 02 / RW 03', progress: '100%', status: 'Selesai' },
        ],
      },
    },
  },
}

export const puskesmasDashboardLayout = {
  filters: [
    { value: 'semester-1', label: 'Semester 1' },
    { value: 'semester-2', label: 'Semester 2' },
  ],
  dataByFilter: {
    'semester-1': {
      summary: 'Dashboard puskesmas difokuskan untuk membaca capaian para kader, status verifikasi, dan kualitas hasil wilayah kerja secara operasional.',
      cards: [
        { label: 'Kader Aktif', value: '18/22', subtitle: '4 kader perlu dorongan tambahan', color: 'blue' },
        { label: 'Survei Masuk', value: '3.842', subtitle: 'Rata-rata 640 survei per bulan', color: 'teal' },
        { label: 'Menunggu Verifikasi', value: '127', subtitle: '31 item revisi prioritas', color: 'amber' },
        { label: 'Keluarga Intervensi', value: '263', subtitle: 'Masuk pantauan aktif puskesmas', color: 'rose' },
      ],
      leaderboard: [
        { name: 'Rina', completion: 92, visits: 31, drafts: 1, status: 'On Track' },
        { name: 'Dewi', completion: 88, visits: 28, drafts: 2, status: 'On Track' },
        { name: 'Nia', completion: 74, visits: 21, drafts: 3, status: 'Pantau' },
        { name: 'Asep', completion: 63, visits: 17, drafts: 4, status: 'Perlu Atensi' },
      ],
      trend: {
        title: 'Tren Capaian Kader vs Verifikasi',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
        series: [
          { name: 'Survei Masuk', data: [520, 580, 610, 664, 701, 766] },
          { name: 'Terverifikasi', data: [470, 531, 552, 608, 649, 705] },
        ],
      },
      donut: {
        title: 'Status Kader Lapangan',
        labels: ['On Track', 'Pantau', 'Perlu Atensi'],
        series: [55, 27, 18],
      },
      villages: {
        title: 'Snapshot Capaian Desa',
        rows: [
          { desa: 'Sukamaju', survei: '142', valid: '128', iks: '0.74', status: 'Stabil' },
          { desa: 'Mekarjaya', survei: '118', valid: '102', iks: '0.68', status: 'Perlu Intervensi' },
          { desa: 'Harapan', survei: '95', valid: '83', iks: '0.59', status: 'Tertinggal' },
          { desa: 'Cempaka', survei: '131', valid: '124', iks: '0.77', status: 'Baik' },
        ],
      },
      alerts: [
        { title: 'Harapan tertinggal coverage', status: 'Prioritas', description: 'Perlu redistribusi keluarga sasaran dan pendampingan kader minggu ini.' },
        { title: 'Mekarjaya revisi cukup tinggi', status: 'Atensi', description: 'Mutu bukti kunjungan dan kelengkapan jawaban perlu diaudit lebih cepat.' },
        { title: 'Cempaka jadi benchmark internal', status: 'Baik', description: 'Desa ini dapat dijadikan acuan pola kerja kader dan verifikator.' },
      ],
    },
    'semester-2': {
      summary: 'Semester kedua menunjukkan perbaikan ritme kerja kader dan penurunan backlog verifikasi, namun pengawasan desa tertinggal tetap harus ketat.',
      cards: [
        { label: 'Kader Aktif', value: '20/22', subtitle: 'Distribusi kerja lapangan lebih sehat', color: 'blue' },
        { label: 'Survei Masuk', value: '4.116', subtitle: 'Ada kenaikan performa lapangan', color: 'teal' },
        { label: 'Menunggu Verifikasi', value: '96', subtitle: 'Backlog lebih rendah dari semester lalu', color: 'amber' },
        { label: 'Keluarga Intervensi', value: '241', subtitle: 'Follow-up mulai lebih tertata', color: 'rose' },
      ],
      leaderboard: [
        { name: 'Rina', completion: 94, visits: 34, drafts: 1, status: 'On Track' },
        { name: 'Dewi', completion: 90, visits: 29, drafts: 1, status: 'On Track' },
        { name: 'Nia', completion: 82, visits: 24, drafts: 2, status: 'Pantau' },
        { name: 'Asep', completion: 71, visits: 20, drafts: 3, status: 'Pantau' },
      ],
      trend: {
        title: 'Tren Capaian Kader vs Verifikasi',
        categories: ['Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
        series: [
          { name: 'Survei Masuk', data: [640, 672, 689, 701, 706, 708] },
          { name: 'Terverifikasi', data: [604, 638, 651, 669, 681, 688] },
        ],
      },
      donut: {
        title: 'Status Kader Lapangan',
        labels: ['On Track', 'Pantau', 'Perlu Atensi'],
        series: [61, 29, 10],
      },
      villages: {
        title: 'Snapshot Capaian Desa',
        rows: [
          { desa: 'Sukamaju', survei: '151', valid: '141', iks: '0.77', status: 'Baik' },
          { desa: 'Mekarjaya', survei: '127', valid: '115', iks: '0.70', status: 'Stabil' },
          { desa: 'Harapan', survei: '109', valid: '94', iks: '0.63', status: 'Pantau' },
          { desa: 'Cempaka', survei: '139', valid: '131', iks: '0.79', status: 'Baik' },
        ],
      },
      alerts: [
        { title: 'Harapan mulai membaik', status: 'Pantau', description: 'Perlu pengawasan berkelanjutan agar tidak kembali tertinggal pada penutupan periode.' },
        { title: 'Backlog verifikasi turun', status: 'Baik', description: 'Ritme approval lebih sehat dan pelaporan menjadi lebih lancar.' },
        { title: 'Kader lebih merata performanya', status: 'Baik', description: 'Semester ini distribusi kunjungan dan draft jauh lebih terkendali.' },
      ],
    },
  },
}

export const dinkesDashboardLayout = {
  filters: [
    { value: '2026', label: 'Tahun 2026' },
    { value: '2025', label: 'Tahun 2025' },
  ],
  dataByFilter: {
    '2026': {
      summary: 'Dashboard dinkes mencakup seluruh data puskesmas di wilayah untuk membaca capaian IKS, coverage, ranking unit, dan konsentrasi desa prioritas.',
      cards: [
        { label: 'Keluarga Tersurvei', value: '124.592', subtitle: '91% terhadap target kabupaten', color: 'blue' },
        { label: 'IKS Kabupaten', value: '0.682', subtitle: 'Naik 0.041 dari tahun lalu', color: 'teal' },
        { label: 'Puskesmas On Track', value: '18/24', subtitle: '6 unit perlu percepatan', color: 'emerald' },
        { label: 'Desa Prioritas', value: '37', subtitle: 'Fokus intervensi indikator dominan', color: 'amber' },
      ],
      mapSummary: [
        { label: 'Wilayah terbaik', value: 'Puskesmas Cempaka', note: 'IKS 0.78 dan coverage 97%' },
        { label: 'Wilayah terendah', value: 'Puskesmas Harapan', note: 'Perlu pembinaan lanjutan lintas indikator' },
        { label: 'Indikator dominan', value: 'Merokok dalam rumah', note: 'Masalah utama di wilayah barat dan selatan' },
      ],
      trend: {
        title: 'Tren Capaian Seluruh Puskesmas',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
        series: [
          { name: 'Keluarga Disurvei', data: [8400, 8800, 9100, 9440, 9820, 10160, 10320, 10640, 10880, 11140, 11320, 11670] },
          { name: 'IKS x10000', data: [6100, 6200, 6320, 6400, 6510, 6590, 6660, 6700, 6750, 6810, 6840, 6820] },
        ],
      },
      donut: {
        title: 'Komposisi Status Keluarga',
        labels: ['Sehat', 'Tidak Sehat'],
        series: [65, 24, 11],
      },
      rankings: {
        title: 'Ranking Puskesmas',
        rows: [
          { unit: 'Puskesmas Cempaka', iks: '0.78', coverage: '97%', trend: 'Naik Stabil', status: 'Baik' },
          { unit: 'Puskesmas Sukamaju', iks: '0.74', coverage: '94%', trend: 'Naik Moderat', status: 'Baik' },
          { unit: 'Puskesmas Mekarsari', iks: '0.67', coverage: '88%', trend: 'Fluktuatif', status: 'Pantau' },
          { unit: 'Puskesmas Harapan', iks: '0.63', coverage: '79%', trend: 'Tertinggal', status: 'Atensi' },
        ],
      },
      focusIndicators: [
        { label: 'Merokok dalam rumah', value: '41%', progress: 41, status: 'Prioritas', note: 'Masih menjadi indikator dominan bermasalah.' },
        { label: 'Kepesertaan JKN', value: '73%', progress: 73, status: 'Pantau', note: 'Mulai membaik, tetapi belum merata di semua unit.' },
        { label: 'Akses jamban sehat', value: '82%', progress: 82, status: 'Baik', note: 'Cukup kuat dan bisa dijadikan titik stabilisasi capaian.' },
      ],
    },
    '2025': {
      summary: 'Tampilan historis untuk melihat baseline seluruh puskesmas di wilayah sebelum pertumbuhan IKS dan coverage 2026 terjadi.',
      cards: [
        { label: 'Keluarga Tersurvei', value: '109.820', subtitle: '85% terhadap target kabupaten', color: 'blue' },
        { label: 'IKS Kabupaten', value: '0.641', subtitle: 'Baseline evaluasi wilayah', color: 'teal' },
        { label: 'Puskesmas On Track', value: '15/24', subtitle: 'Masih banyak unit adaptasi target', color: 'emerald' },
        { label: 'Desa Prioritas', value: '44', subtitle: 'Lebih banyak desa perlu intervensi', color: 'amber' },
      ],
      mapSummary: [
        { label: 'Wilayah terbaik', value: 'Puskesmas Cempaka', note: 'Masih memimpin stabil di baseline 2025' },
        { label: 'Wilayah terendah', value: 'Puskesmas Harapan', note: 'Menjadi fokus pembinaan sejak awal 2026' },
        { label: 'Indikator dominan', value: 'Merokok dalam rumah', note: 'Masalah terbesar yang menahan percepatan IKS' },
      ],
      trend: {
        title: 'Tren Capaian Seluruh Puskesmas',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
        series: [
          { name: 'Keluarga Disurvei', data: [7300, 7580, 7810, 8140, 8420, 8670, 8910, 9160, 9380, 9620, 9850, 10020] },
          { name: 'IKS x10000', data: [5700, 5780, 5890, 6010, 6090, 6160, 6230, 6280, 6340, 6390, 6420, 6410] },
        ],
      },
      donut: {
        title: 'Komposisi Status Keluarga',
        labels: ['Sehat', 'Tidak Sehat'],
        series: [61, 26, 13],
      },
      rankings: {
        title: 'Ranking Puskesmas',
        rows: [
          { unit: 'Puskesmas Cempaka', iks: '0.72', coverage: '93%', trend: 'Stabil', status: 'Baik' },
          { unit: 'Puskesmas Sukamaju', iks: '0.69', coverage: '89%', trend: 'Naik Tipis', status: 'Baik' },
          { unit: 'Puskesmas Mekarsari', iks: '0.61', coverage: '81%', trend: 'Fluktuatif', status: 'Pantau' },
          { unit: 'Puskesmas Harapan', iks: '0.57', coverage: '72%', trend: 'Menurun', status: 'Atensi' },
        ],
      },
      focusIndicators: [
        { label: 'Merokok dalam rumah', value: '45%', progress: 45, status: 'Prioritas', note: 'Masalah dominan yang paling menahan pertumbuhan IKS.' },
        { label: 'Kepesertaan JKN', value: '70%', progress: 70, status: 'Pantau', note: 'Masih banyak keluarga belum tervalidasi penuh.' },
        { label: 'Akses jamban sehat', value: '79%', progress: 79, status: 'Baik', note: 'Sudah cukup kuat tetapi belum merata antar wilayah.' },
      ],
    },
  },
}

export const adminDashboardLayout = {
  filters: [
    { value: '2026', label: 'Tahun 2026' },
    { value: '2025', label: 'Tahun 2025' },
  ],
  dataByFilter: {
    '2026': {
      summary: 'Dashboard admin menjadi representasi paling lengkap dari dashboard kader, puskesmas, dan dinkes, ditambah data penunjang untuk kontrol kualitas proses, mutu wilayah, dan ritme sistem.',
      cards: [
        { label: 'Survei Masuk', value: '44.280', subtitle: 'Gabungan seluruh capaian wilayah', color: 'blue' },
        { label: 'IKS Wilayah', value: '0.682', subtitle: 'Mewakili kesehatan keluarga lintas puskesmas', color: 'teal' },
        { label: 'Kader Aktif', value: '1.820', subtitle: 'Representasi dari performa dashboard kader', color: 'purple' },
        { label: 'Backlog Validasi', value: '129', subtitle: 'Kontrol mutu proses admin-puskesmas', color: 'amber' },
        { label: 'Intervensi Aktif', value: '5.214', subtitle: 'Mencerminkan beban tindak lanjut lintas wilayah', color: 'rose' },
        { label: 'Puskesmas On Track', value: '18/24', subtitle: 'Representasi ringkas dashboard dinkes', color: 'emerald' },
      ],
      topInsights: [
        { title: 'Representasi dashboard kader', value: '86%', note: 'Rerata target pengisian kader masih dalam jalur aman.' },
        { title: 'Representasi dashboard puskesmas', value: '76%', note: 'Rasio validasi wilayah mulai stabil tetapi masih perlu dorongan.' },
        { title: 'Representasi dashboard dinkes', value: '65%', note: 'Status keluarga sehat terus naik namun desa prioritas masih besar.' },
      ],
      trend: {
        title: 'Tren Besar Sistem',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
        series: [
          { name: 'Survei Masuk', data: [2800, 3100, 3280, 3450, 3690, 3820, 3950, 4020, 4160, 4380, 4510, 4720] },
          { name: 'Tervalidasi', data: [2440, 2860, 2980, 3120, 3380, 3520, 3660, 3750, 3890, 4020, 4170, 4310] },
        ],
      },
      donut: {
        title: 'Proporsi Status Sistem',
        labels: ['Valid', 'Revisi', 'Belum Dicek'],
        series: [68, 22, 10],
      },
      supporting: [
        { label: 'Sinkronisasi unit', value: '24/24', progress: 100, status: 'Baik', note: 'Semua unit aktif mengirim pembaruan.' },
        { label: 'SLA validasi 48 jam', value: '82%', progress: 82, status: 'Pantau', note: 'Masih ada gap terhadap target internal 90%.' },
        { label: 'Intervensi tertutup', value: '79%', progress: 79, status: 'Atensi', note: 'Kasus tahap dua masih cukup dominan.' },
      ],
      regions: {
        title: 'Ringkasan Wilayah Prioritas',
        rows: [
          { area: 'Kec. Sukamaju', target: '12.400', realisasi: '12.018', coverage: '97%', status: 'Baik' },
          { area: 'Kec. Harapan', target: '10.800', realisasi: '9.442', coverage: '87%', status: 'Perlu Eskalasi' },
          { area: 'Kec. Cempaka', target: '10.500', realisasi: '9.991', coverage: '95%', status: 'Stabil' },
          { area: 'Kec. Mekarsari', target: '10.600', realisasi: '10.213', coverage: '96%', status: 'Baik' },
        ],
      },
      adminNotes: [
        { title: 'Unit Harapan perlu pendampingan ganda', status: 'Prioritas', description: 'Masalah coverage, revisi, dan intervensi bertemu di unit yang sama sehingga butuh kontrol admin lebih ketat.' },
        { title: 'Mutu sinkronisasi sudah stabil', status: 'Baik', description: 'Admin bisa lebih fokus ke kualitas approval dan pemerataan beban lapangan.' },
        { title: 'Dashboard ini menggabungkan 3 sudut pandang', status: 'Info', description: 'Kader untuk target pengisian, puskesmas untuk performa kader, dan dinkes untuk agregasi wilayah.' },
      ],
    },
    '2025': {
      summary: 'Versi historis dashboard admin untuk membaca baseline lengkap dari semua level sebelum perbaikan proses dan tampilan 2026 dijalankan.',
      cards: [
        { label: 'Survei Masuk', value: '39.840', subtitle: 'Akumulasi lintas seluruh wilayah', color: 'blue' },
        { label: 'IKS Wilayah', value: '0.641', subtitle: 'Baseline untuk evaluasi sistem', color: 'teal' },
        { label: 'Kader Aktif', value: '1.744', subtitle: 'Distribusi unit belum merata', color: 'purple' },
        { label: 'Backlog Validasi', value: '174', subtitle: 'Lebih berat daripada 2026', color: 'amber' },
        { label: 'Intervensi Aktif', value: '4.802', subtitle: 'Banyak kasus belum tuntas', color: 'rose' },
        { label: 'Puskesmas On Track', value: '15/24', subtitle: 'Masih banyak unit tertinggal', color: 'emerald' },
      ],
      topInsights: [
        { title: 'Representasi dashboard kader', value: '74%', note: 'Target pengisian masih belum seimbang antar wilayah kerja.' },
        { title: 'Representasi dashboard puskesmas', value: '68%', note: 'Verifikasi dan pemerataan kinerja kader masih lemah.' },
        { title: 'Representasi dashboard dinkes', value: '61%', note: 'Proporsi desa sehat masih tertahan cukup besar.' },
      ],
      trend: {
        title: 'Tren Besar Sistem',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
        series: [
          { name: 'Survei Masuk', data: [2400, 2590, 2760, 2950, 3090, 3210, 3340, 3460, 3590, 3720, 3870, 4010] },
          { name: 'Tervalidasi', data: [2080, 2290, 2410, 2590, 2720, 2830, 2960, 3040, 3170, 3290, 3410, 3550] },
        ],
      },
      donut: {
        title: 'Proporsi Status Sistem',
        labels: ['Valid', 'Revisi', 'Belum Dicek'],
        series: [63, 24, 13],
      },
      supporting: [
        { label: 'Sinkronisasi unit', value: '21/24', progress: 88, status: 'Pantau', note: 'Masih ada unit yang belum konsisten mengirim pembaruan.' },
        { label: 'SLA validasi 48 jam', value: '74%', progress: 74, status: 'Atensi', note: 'Inilah alasan penataan proses dan dashboard baru diperlukan.' },
        { label: 'Intervensi tertutup', value: '71%', progress: 71, status: 'Perlu Eskalasi', note: 'Follow-up keluarga belum cukup cepat di banyak unit.' },
      ],
      regions: {
        title: 'Ringkasan Wilayah Prioritas',
        rows: [
          { area: 'Kec. Sukamaju', target: '11.900', realisasi: '10.890', coverage: '92%', status: 'Stabil' },
          { area: 'Kec. Harapan', target: '10.300', realisasi: '8.240', coverage: '80%', status: 'Perlu Eskalasi' },
          { area: 'Kec. Cempaka', target: '10.100', realisasi: '9.401', coverage: '93%', status: 'Baik' },
          { area: 'Kec. Mekarsari', target: '10.200', realisasi: '9.118', coverage: '89%', status: 'Pantau' },
        ],
      },
      adminNotes: [
        { title: 'Proses 2025 masih berat di validasi', status: 'Atensi', description: 'Porsi revisi dan belum dicek lebih tinggi sehingga laporan sering tertahan di akhir periode.' },
        { title: 'Distribusi kader belum merata', status: 'Pantau', description: 'Ketimpangan beban kerja langsung memengaruhi coverage dan mutu data.' },
        { title: 'Data historis ini menjadi pijakan 2026', status: 'Info', description: 'Karena itu dashboard admin perlu tetap lengkap dan mampu membaca lintas lapisan peran.' },
      ],
    },
  },
}
