const districts = [
  { id: '3201010', name: 'Kec. Sukamaju' },
  { id: '3201011', name: 'Kec. Harapan' },
  { id: '3201012', name: 'Kec. Cempaka' },
]

const puskesmas = [
  { id: 'PKM-01', districtId: '3201010', name: 'Puskesmas Sukamaju' },
  { id: 'PKM-02', districtId: '3201011', name: 'Puskesmas Harapan' },
  { id: 'PKM-03', districtId: '3201012', name: 'Puskesmas Cempaka' },
]

const villages = [
  { id: '3201010001', districtId: '3201010', puskesmasId: 'PKM-01', name: 'Desa Sukamaju' },
  { id: '3201010002', districtId: '3201010', puskesmasId: 'PKM-01', name: 'Desa Cempaka' },
  { id: '3201011001', districtId: '3201011', puskesmasId: 'PKM-02', name: 'Desa Mekar' },
  { id: '3201011003', districtId: '3201011', puskesmasId: 'PKM-02', name: 'Desa Harapan Jaya' },
  { id: '3201012004', districtId: '3201012', puskesmasId: 'PKM-03', name: 'Desa Cempaka Indah' },
]

const kaderList = [
  { id: 'KDR-0011', name: 'Siti Aminah', villageId: '3201010001', puskesmasId: 'PKM-01' },
  { id: 'KDR-0012', name: 'Bambang Saputra', villageId: '3201011003', puskesmasId: 'PKM-02' },
  { id: 'KDR-0013', name: 'Dewi Lestari', villageId: '3201010002', puskesmasId: 'PKM-01' },
  { id: 'KDR-0014', name: 'Mila Kurnia', villageId: '3201012004', puskesmasId: 'PKM-03' },
]

const draftStatusMeta = {
  DRAFT: { label: 'Draft Aktif', tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
  NEEDS_SYNC: { label: 'Belum Sinkron', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  READY_SUBMIT: { label: 'Siap Kirim', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
}

const historyStatusMeta = {
  APPROVED: { label: 'Disetujui', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  REVISION: { label: 'Perlu Revisi', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  REJECTED: { label: 'Ditolak', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
  SUBMITTED: { label: 'Menunggu Validasi', tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
}

const interventionStatusMeta = {
  PENDING: { label: 'Menunggu', tone: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  SCHEDULED: { label: 'Terjadwal', tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
  ONGOING: { label: 'Berjalan', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  DONE: { label: 'Selesai', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  OVERDUE: { label: 'Terlambat', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
}

const priorityMeta = {
  HIGH: { label: 'Prioritas Tinggi', tone: 'danger' },
  MEDIUM: { label: 'Prioritas Sedang', tone: 'warning' },
  LOW: { label: 'Prioritas Rendah', tone: 'info' },
}

const syncStatusMeta = {
  SYNCED: { label: 'Sinkron', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  OFFLINE: { label: 'Offline', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  CONFLICT: { label: 'Konflik Data', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
}

const healthStatusMeta = {
  SEHAT: { label: 'Sehat', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  TIDAK_SEHAT: { label: 'Tidak Sehat', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
}

const draftRecords = [
  {
    id: 'DRF-001',
    householdNo: '3172012301000001',
    householdHead: 'Budi Santoso',
    address: 'RT 01 / RW 02, Desa Sukamaju',
    districtId: '3201010',
    villageId: '3201010001',
    puskesmasId: 'PKM-01',
    lastUpdatedAt: '2026-06-11T08:20:00+07:00',
    surveyStep: 'Jawaban indikator rumah tangga',
    completionPercent: 72,
    draftStatus: 'DRAFT',
    syncStatus: 'OFFLINE',
    respondentCount: 4,
    flaggedNotes: 'Sinyal sempat hilang saat input indikator JKN.',
  },
  {
    id: 'DRF-002',
    householdNo: '3172012301000045',
    householdHead: 'Sulastri',
    address: 'RT 04 / RW 03, Desa Mekar',
    districtId: '3201011',
    villageId: '3201011001',
    puskesmasId: 'PKM-02',
    lastUpdatedAt: '2026-06-10T15:48:00+07:00',
    surveyStep: 'Identitas responden',
    completionPercent: 31,
    draftStatus: 'NEEDS_SYNC',
    syncStatus: 'CONFLICT',
    respondentCount: 2,
    flaggedNotes: 'Nomor KK berubah setelah sinkronisasi terakhir.',
  },
  {
    id: 'DRF-003',
    householdNo: '3172012301000101',
    householdHead: 'Agus Salim',
    address: 'RT 02 / RW 01, Desa Cempaka',
    districtId: '3201010',
    villageId: '3201010002',
    puskesmasId: 'PKM-01',
    lastUpdatedAt: '2026-06-10T11:15:00+07:00',
    surveyStep: 'Review akhir',
    completionPercent: 96,
    draftStatus: 'READY_SUBMIT',
    syncStatus: 'SYNCED',
    respondentCount: 3,
    flaggedNotes: 'Siap dikirim setelah review singkat kader.',
  },
  {
    id: 'DRF-004',
    householdNo: '3172012301000110',
    householdHead: 'Nurhayati',
    address: 'RT 06 / RW 02, Desa Sukamaju',
    districtId: '3201010',
    villageId: '3201010001',
    puskesmasId: 'PKM-01',
    lastUpdatedAt: '2026-06-09T17:42:00+07:00',
    surveyStep: 'Jawaban indikator individu',
    completionPercent: 58,
    draftStatus: 'DRAFT',
    syncStatus: 'SYNCED',
    respondentCount: 6,
    flaggedNotes: 'Masih perlu cek data hipertensi.',
  },
  {
    id: 'DRF-005',
    householdNo: '3172012301000111',
    householdHead: 'Wawan Setiawan',
    address: 'RT 01 / RW 04, Desa Cempaka Indah',
    districtId: '3201012',
    villageId: '3201012004',
    puskesmasId: 'PKM-03',
    lastUpdatedAt: '2026-06-08T09:50:00+07:00',
    surveyStep: 'Data lokasi',
    completionPercent: 18,
    draftStatus: 'NEEDS_SYNC',
    syncStatus: 'OFFLINE',
    respondentCount: 4,
    flaggedNotes: 'Belum lanjut sejak kunjungan awal.',
  },
]

const historyRecords = [
  {
    id: 'SV-2026-091',
    householdNo: '3172012301000009',
    householdHead: 'Rahman Hakim',
    respondentName: 'Nina Rahman',
    districtId: '3201010',
    villageId: '3201010001',
    puskesmasId: 'PKM-01',
    submittedAt: '2026-06-10T09:30:00+07:00',
    iksScore: 0.79,
    healthStatus: 'SEHAT',
    validationStatus: 'APPROVED',
    interventionStatus: 'Tidak perlu intervensi',
    revisionNote: '',
  },
  {
    id: 'SV-2026-088',
    householdNo: '3172012301000012',
    householdHead: 'Joko Pranoto',
    respondentName: 'Nani Joko',
    districtId: '3201011',
    villageId: '3201011003',
    puskesmasId: 'PKM-02',
    submittedAt: '2026-06-09T14:05:00+07:00',
    iksScore: 0.44,
    healthStatus: 'TIDAK_SEHAT',
    validationStatus: 'REVISION',
    interventionStatus: 'Menunggu revisi data',
    revisionNote: 'Mohon unggah ulang catatan tensi dan cek NIK responden.',
  },
  {
    id: 'SV-2026-081',
    householdNo: '3172012301000020',
    householdHead: 'Sulastri',
    respondentName: 'Sulastri',
    districtId: '3201011',
    villageId: '3201011001',
    puskesmasId: 'PKM-02',
    submittedAt: '2026-06-08T11:20:00+07:00',
    iksScore: 0.91,
    healthStatus: 'SEHAT',
    validationStatus: 'APPROVED',
    interventionStatus: 'Tidak perlu intervensi',
    revisionNote: '',
  },
  {
    id: 'SV-2026-077',
    householdNo: '3172012301000021',
    householdHead: 'Agus Salim',
    respondentName: 'Agus Salim',
    districtId: '3201010',
    villageId: '3201010002',
    puskesmasId: 'PKM-01',
    submittedAt: '2026-06-07T16:10:00+07:00',
    iksScore: 0.39,
    healthStatus: 'TIDAK_SEHAT',
    validationStatus: 'SUBMITTED',
    interventionStatus: 'Perlu intervensi prioritas',
    revisionNote: '',
  },
  {
    id: 'SV-2026-072',
    householdNo: '3172012301000031',
    householdHead: 'Dedi Kurnia',
    respondentName: 'Sari Dedi',
    districtId: '3201012',
    villageId: '3201012004',
    puskesmasId: 'PKM-03',
    submittedAt: '2026-06-06T10:00:00+07:00',
    iksScore: 0.52,
    healthStatus: 'TIDAK_SEHAT',
    validationStatus: 'REJECTED',
    interventionStatus: 'Input ulang diperlukan',
    revisionNote: 'Data rumah tangga terduplikasi dengan KK lain.',
  },
]

const interventionMonitoringRecords = [
  {
    id: 'INT-001',
    householdHead: 'Agus Salim',
    householdNo: '3172012301000021',
    districtId: '3201010',
    villageId: '3201010002',
    puskesmasId: 'PKM-01',
    kaderId: 'KDR-0013',
    issueSummary: 'Merokok aktif, TB belum rutin berobat',
    issueCount: 2,
    priority: 'HIGH',
    progressLabel: '1 dari 3 sesi edukasi',
    status: 'ONGOING',
    nextVisitAt: '2026-06-13T09:00:00+07:00',
    lastActionAt: '2026-06-10T13:00:00+07:00',
    notes: 'Keluarga bersedia menerima kunjungan ulang bersama petugas.',
  },
  {
    id: 'INT-002',
    householdHead: 'Joko Pranoto',
    householdNo: '3172012301000012',
    districtId: '3201011',
    villageId: '3201011003',
    puskesmasId: 'PKM-02',
    kaderId: 'KDR-0012',
    issueSummary: 'Hipertensi tidak terkontrol',
    issueCount: 1,
    priority: 'HIGH',
    progressLabel: 'Belum ada sesi',
    status: 'PENDING',
    nextVisitAt: '2026-06-12T10:30:00+07:00',
    lastActionAt: '2026-06-09T09:15:00+07:00',
    notes: 'Butuh penjadwalan rumah bersama keluarga.',
  },
  {
    id: 'INT-003',
    householdHead: 'Nurhayati',
    householdNo: '3172012301000110',
    districtId: '3201010',
    villageId: '3201010001',
    puskesmasId: 'PKM-01',
    kaderId: 'KDR-0011',
    issueSummary: 'Kepatuhan pengobatan hipertensi dan JKN',
    issueCount: 2,
    priority: 'MEDIUM',
    progressLabel: '2 dari 2 sesi edukasi',
    status: 'DONE',
    nextVisitAt: '2026-06-18T08:00:00+07:00',
    lastActionAt: '2026-06-08T11:00:00+07:00',
    notes: 'Masuk monitoring ringan bulan depan.',
  },
  {
    id: 'INT-004',
    householdHead: 'Wawan Setiawan',
    householdNo: '3172012301000111',
    districtId: '3201012',
    villageId: '3201012004',
    puskesmasId: 'PKM-03',
    kaderId: 'KDR-0014',
    issueSummary: 'Air bersih dan jamban sehat',
    issueCount: 2,
    priority: 'HIGH',
    progressLabel: '1 dari 2 sesi edukasi',
    status: 'OVERDUE',
    nextVisitAt: '2026-06-09T08:30:00+07:00',
    lastActionAt: '2026-06-05T16:00:00+07:00',
    notes: 'Perlu dukungan lintas program desa.',
  },
  {
    id: 'INT-005',
    householdHead: 'Sulastri',
    householdNo: '3172012301000020',
    districtId: '3201011',
    villageId: '3201011001',
    puskesmasId: 'PKM-02',
    kaderId: 'KDR-0012',
    issueSummary: 'Aktivitas fisik keluarga',
    issueCount: 1,
    priority: 'LOW',
    progressLabel: 'Sesi edukasi terjadwal',
    status: 'SCHEDULED',
    nextVisitAt: '2026-06-14T07:30:00+07:00',
    lastActionAt: '2026-06-10T08:45:00+07:00',
    notes: 'Intervensi promotif ringan.',
  },
]

const interventionLogRecords = [
  {
    id: 'LOG-001',
    scheduleId: 'INT-001',
    householdHead: 'Agus Salim',
    districtId: '3201010',
    villageId: '3201010002',
    topic: 'Edukasi berhenti merokok di rumah',
    result: 'Keluarga sepakat membuat area bebas rokok.',
    followUp: 'Kunjungan ulang 1 minggu',
    status: 'ONGOING',
    createdAt: '2026-06-10T13:00:00+07:00',
    recordedBy: 'Dewi Lestari',
  },
  {
    id: 'LOG-002',
    scheduleId: 'INT-003',
    householdHead: 'Nurhayati',
    districtId: '3201010',
    villageId: '3201010001',
    topic: 'Kepatuhan obat hipertensi',
    result: 'Obat diminum teratur dengan pengingat keluarga.',
    followUp: 'Monitoring telepon 2 minggu',
    status: 'DONE',
    createdAt: '2026-06-08T11:00:00+07:00',
    recordedBy: 'Siti Aminah',
  },
  {
    id: 'LOG-003',
    scheduleId: 'INT-004',
    householdHead: 'Wawan Setiawan',
    districtId: '3201012',
    villageId: '3201012004',
    topic: 'Akses air bersih rumah tangga',
    result: 'Keluarga butuh dukungan material dan koordinasi RT.',
    followUp: 'Eskalasi ke Puskesmas dan aparat desa',
    status: 'OVERDUE',
    createdAt: '2026-06-05T16:00:00+07:00',
    recordedBy: 'Mila Kurnia',
  },
  {
    id: 'LOG-004',
    scheduleId: 'INT-005',
    householdHead: 'Sulastri',
    districtId: '3201011',
    villageId: '3201011001',
    topic: 'Aktivitas fisik keluarga',
    result: 'Keluarga memilih jalan pagi bersama 3 kali per minggu.',
    followUp: 'Cek kepatuhan bulan depan',
    status: 'SCHEDULED',
    createdAt: '2026-06-10T08:45:00+07:00',
    recordedBy: 'Bambang Saputra',
  },
]

const wilayahRecords = [
  {
    id: 'WIL-001',
    districtId: '3201010',
    villageId: '3201010001',
    rt: '01',
    rw: '02',
    totalHouseholds: 56,
    surveyedHouseholds: 43,
    healthyCount: 27,
    priorityCount: 8,
    avgIks: 0.67,
    healthStatus: 'TIDAK_SEHAT',
    notes: 'Coverage cukup tinggi, fokus pada keluarga hipertensi dan JKN.',
  },
  {
    id: 'WIL-002',
    districtId: '3201010',
    villageId: '3201010001',
    rt: '03',
    rw: '02',
    totalHouseholds: 48,
    surveyedHouseholds: 29,
    healthyCount: 14,
    priorityCount: 12,
    avgIks: 0.49,
    healthStatus: 'TIDAK_SEHAT',
    notes: 'Backlog survey dan intervensi lingkungan masih tinggi.',
  },
  {
    id: 'WIL-003',
    districtId: '3201010',
    villageId: '3201010002',
    rt: '02',
    rw: '01',
    totalHouseholds: 38,
    surveyedHouseholds: 31,
    healthyCount: 22,
    priorityCount: 5,
    avgIks: 0.74,
    healthStatus: 'SEHAT',
    notes: 'Perlu menjaga ritme validasi dan kunjungan edukasi.',
  },
  {
    id: 'WIL-004',
    districtId: '3201012',
    villageId: '3201012004',
    rt: '01',
    rw: '04',
    totalHouseholds: 44,
    surveyedHouseholds: 18,
    healthyCount: 9,
    priorityCount: 14,
    avgIks: 0.42,
    healthStatus: 'TIDAK_SEHAT',
    notes: 'Area prioritas untuk air bersih, jamban, dan rokok aktif.',
  },
]

const profileSummary = {
  fullName: 'Siti Aminah',
  username: 'siti.aminah',
  email: 'siti.aminah@sisphs.test',
  phone: '081234567890',
  role: 'Kader Survei',
  puskesmasName: 'Puskesmas Sukamaju',
  districtName: 'Kec. Sukamaju',
  villages: ['Desa Sukamaju', 'Desa Cempaka'],
  coverageArea: 'RT 01-03 / RW 02',
  totalManagedHouseholds: 142,
  totalSubmittedSurveys: 118,
  pendingDrafts: 3,
  syncStatus: 'SYNCED',
  lastSyncAt: '2026-06-11T07:12:00+07:00',
  deviceLabel: 'Samsung Galaxy A54',
  joinedAt: '2025-01-14T09:00:00+07:00',
}

const profileActivity = [
  { label: 'Draft aktif', value: '3', caption: '2 perlu sinkronisasi sebelum dikirim.' },
  { label: 'Survei bulan ini', value: '17', caption: '5 di antaranya sudah tervalidasi penuh.' },
  { label: 'Intervensi aktif', value: '4', caption: '1 keluarga masuk prioritas tinggi.' },
]

const aggregateReportRows = [
  {
    id: 'AGR-001',
    districtId: '3201010',
    puskesmasId: 'PKM-01',
    totalFamilies: 1380,
    validatedFamilies: 1266,
    avgIks: 0.74,
    healthyPct: 68,
    backlog: 114,
    priorityFamilies: 123,
    status: 'STABLE',
  },
  {
    id: 'AGR-002',
    districtId: '3201011',
    puskesmasId: 'PKM-02',
    totalFamilies: 1244,
    validatedFamilies: 1089,
    avgIks: 0.61,
    healthyPct: 56,
    backlog: 155,
    priorityFamilies: 188,
    status: 'WARNING',
  },
  {
    id: 'AGR-003',
    districtId: '3201012',
    puskesmasId: 'PKM-03',
    totalFamilies: 998,
    validatedFamilies: 812,
    avgIks: 0.48,
    healthyPct: 41,
    backlog: 186,
    priorityFamilies: 241,
    status: 'PRIORITY',
  },
]

const aggregateStatusMeta = {
  GOOD: { label: 'Sangat Baik', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  STABLE: { label: 'Stabil', tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
  WARNING: { label: 'Waspada', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  PRIORITY: { label: 'Prioritas', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
}

const desaReportRows = [
  {
    id: 'DSA-001',
    districtId: '3201010',
    puskesmasId: 'PKM-01',
    villageId: '3201010001',
    totalRespondents: 322,
    avgIks: 0.71,
    healthyPct: 66,
    unhealthyPct: 18,
    backlog: 24,
    dominantIndicator: 'Kepatuhan pengobatan hipertensi',
    status: 'STABLE',
  },
  {
    id: 'DSA-002',
    districtId: '3201010',
    puskesmasId: 'PKM-01',
    villageId: '3201010002',
    totalRespondents: 284,
    avgIks: 0.65,
    healthyPct: 58,
    unhealthyPct: 24,
    backlog: 16,
    dominantIndicator: 'Rumah tangga bebas rokok',
    status: 'WARNING',
  },
  {
    id: 'DSA-003',
    districtId: '3201011',
    puskesmasId: 'PKM-02',
    villageId: '3201011001',
    totalRespondents: 246,
    avgIks: 0.57,
    healthyPct: 49,
    unhealthyPct: 31,
    backlog: 28,
    dominantIndicator: 'Aktivitas fisik',
    status: 'PRIORITY',
  },
  {
    id: 'DSA-004',
    districtId: '3201011',
    puskesmasId: 'PKM-02',
    villageId: '3201011003',
    totalRespondents: 301,
    avgIks: 0.69,
    healthyPct: 62,
    unhealthyPct: 19,
    backlog: 19,
    dominantIndicator: 'Konsumsi buah dan sayur',
    status: 'STABLE',
  },
  {
    id: 'DSA-005',
    districtId: '3201012',
    puskesmasId: 'PKM-03',
    villageId: '3201012004',
    totalRespondents: 267,
    avgIks: 0.46,
    healthyPct: 39,
    unhealthyPct: 37,
    backlog: 34,
    dominantIndicator: 'Air bersih dan jamban sehat',
    status: 'PRIORITY',
  },
]

function matchesKeyword(record, keyword, fields) {
  if (!keyword) return true
  const haystack = fields.map((field) => record[field] || '').join(' ').toLowerCase()
  return haystack.includes(keyword.toLowerCase())
}

function paginate(data, page = 1, perPage = 5) {
  const total = data.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * perPage

  return {
    data: data.slice(start, start + perPage),
    meta: {
      page: currentPage,
      perPage,
      total,
      totalPages,
      from: total === 0 ? 0 : start + 1,
      to: total === 0 ? 0 : Math.min(start + perPage, total),
    },
  }
}

function getVillageName(villageId) {
  return villages.find((item) => item.id === villageId)?.name || '-'
}

function getDistrictName(districtId) {
  return districts.find((item) => item.id === districtId)?.name || '-'
}

function getPuskesmasName(puskesmasId) {
  return puskesmas.find((item) => item.id === puskesmasId)?.name || '-'
}

function getKaderName(kaderId) {
  return kaderList.find((item) => item.id === kaderId)?.name || '-'
}

export function getOperationalOptions({ districtId = '', puskesmasId = '' } = {}) {
  return {
    districts,
    puskesmas: districtId ? puskesmas.filter((item) => item.districtId === districtId) : puskesmas,
    villages: puskesmasId
      ? villages.filter((item) => item.puskesmasId === puskesmasId)
      : districtId
        ? villages.filter((item) => item.districtId === districtId)
        : villages,
    kaders: puskesmasId ? kaderList.filter((item) => item.puskesmasId === puskesmasId) : kaderList,
    draftStatuses: Object.entries(draftStatusMeta).map(([value, meta]) => ({ value, label: meta.label })),
    syncStatuses: Object.entries(syncStatusMeta).map(([value, meta]) => ({ value, label: meta.label })),
    validationStatuses: Object.entries(historyStatusMeta).map(([value, meta]) => ({ value, label: meta.label })),
    interventionStatuses: Object.entries(interventionStatusMeta).map(([value, meta]) => ({ value, label: meta.label })),
    priorities: Object.entries(priorityMeta).map(([value, meta]) => ({ value, label: meta.label })),
  }
}

export function getDraftStatusMeta(status) {
  return draftStatusMeta[status] || draftStatusMeta.DRAFT
}

export function getSyncStatusMeta(status) {
  return syncStatusMeta[status] || syncStatusMeta.SYNCED
}

export function getHistoryStatusMeta(status) {
  return historyStatusMeta[status] || historyStatusMeta.SUBMITTED
}

export function getInterventionStatusMeta(status) {
  return interventionStatusMeta[status] || interventionStatusMeta.PENDING
}

export function getPriorityMeta(priority) {
  return priorityMeta[priority] || priorityMeta.MEDIUM
}

export function getHealthStatusMeta(status) {
  return healthStatusMeta[status] || healthStatusMeta.TIDAK_SEHAT
}

export function getAggregateStatusMeta(status) {
  return aggregateStatusMeta[status] || aggregateStatusMeta.STABLE
}

export function getDraftSurveyStats() {
  return {
    totalDrafts: draftRecords.length,
    readyToSubmit: draftRecords.filter((item) => item.draftStatus === 'READY_SUBMIT').length,
    needSync: draftRecords.filter((item) => item.syncStatus !== 'SYNCED').length,
    avgCompletion: Math.round(draftRecords.reduce((sum, item) => sum + item.completionPercent, 0) / draftRecords.length),
  }
}

export function getDraftSurveyRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  villageId = '',
  draftStatus = '',
  syncStatus = '',
} = {}) {
  const filtered = draftRecords
    .filter((record) => matchesKeyword(record, search, ['householdNo', 'householdHead', 'address', 'surveyStep']))
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (villageId ? record.villageId === villageId : true))
    .filter((record) => (draftStatus ? record.draftStatus === draftStatus : true))
    .filter((record) => (syncStatus ? record.syncStatus === syncStatus : true))
    .sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt))

  return paginate(filtered, page, perPage)
}

export function getHistorySurveyStats() {
  return {
    total: historyRecords.length,
    approved: historyRecords.filter((item) => item.validationStatus === 'APPROVED').length,
    revision: historyRecords.filter((item) => item.validationStatus === 'REVISION').length,
    needIntervention: historyRecords.filter((item) => item.healthStatus !== 'SEHAT').length,
  }
}

export function getHistorySurveyRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  villageId = '',
  validationStatus = '',
  healthStatus = '',
} = {}) {
  const filtered = historyRecords
    .filter((record) => matchesKeyword(record, search, ['id', 'householdNo', 'householdHead', 'respondentName']))
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (villageId ? record.villageId === villageId : true))
    .filter((record) => (validationStatus ? record.validationStatus === validationStatus : true))
    .filter((record) => (healthStatus ? record.healthStatus === healthStatus : true))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

  return paginate(filtered, page, perPage)
}

export function getInterventionMonitoringStats(records = interventionMonitoringRecords) {
  return {
    totalTargets: records.length,
    highPriority: records.filter((item) => item.priority === 'HIGH').length,
    ongoing: records.filter((item) => item.status === 'ONGOING').length,
    overdue: records.filter((item) => item.status === 'OVERDUE').length,
  }
}

export function getInterventionMonitoringRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  villageId = '',
  puskesmasId = '',
  kaderId = '',
  status = '',
  priority = '',
} = {}) {
  const filtered = interventionMonitoringRecords
    .filter((record) => matchesKeyword(record, search, ['householdHead', 'householdNo', 'issueSummary']))
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (villageId ? record.villageId === villageId : true))
    .filter((record) => (puskesmasId ? record.puskesmasId === puskesmasId : true))
    .filter((record) => (kaderId ? record.kaderId === kaderId : true))
    .filter((record) => (status ? record.status === status : true))
    .filter((record) => (priority ? record.priority === priority : true))
    .sort((a, b) => new Date(a.nextVisitAt) - new Date(b.nextVisitAt))
    .map((record) => ({
      ...record,
      districtName: getDistrictName(record.districtId),
      villageName: getVillageName(record.villageId),
      puskesmasName: getPuskesmasName(record.puskesmasId),
      kaderName: getKaderName(record.kaderId),
    }))

  return paginate(filtered, page, perPage)
}

export function getInterventionScheduleStats() {
  return {
    totalSchedules: interventionMonitoringRecords.length,
    today: 2,
    thisWeek: interventionMonitoringRecords.filter((item) => ['SCHEDULED', 'ONGOING', 'OVERDUE'].includes(item.status)).length,
    priorityVisits: interventionMonitoringRecords.filter((item) => item.priority === 'HIGH').length,
  }
}

export function getInterventionScheduleRecords(query = {}) {
  return getInterventionMonitoringRecords(query)
}

export function getInterventionLogStats() {
  return {
    totalLogs: interventionLogRecords.length,
    completed: interventionLogRecords.filter((item) => item.status === 'DONE').length,
    followUpNeeded: interventionLogRecords.filter((item) => item.status !== 'DONE').length,
    thisMonth: interventionLogRecords.length,
  }
}

export function getInterventionLogRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  villageId = '',
  status = '',
} = {}) {
  const filtered = interventionLogRecords
    .filter((record) => matchesKeyword(record, search, ['householdHead', 'topic', 'result', 'followUp']))
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (villageId ? record.villageId === villageId : true))
    .filter((record) => (status ? record.status === status : true))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((record) => ({
      ...record,
      districtName: getDistrictName(record.districtId),
      villageName: getVillageName(record.villageId),
    }))

  return paginate(filtered, page, perPage)
}

export function getWilayahBinaanStats() {
  const totalHouseholds = wilayahRecords.reduce((sum, item) => sum + item.totalHouseholds, 0)
  const totalSurveyed = wilayahRecords.reduce((sum, item) => sum + item.surveyedHouseholds, 0)

  return {
    totalAreas: wilayahRecords.length,
    totalHouseholds,
    coveragePct: Math.round((totalSurveyed / totalHouseholds) * 100),
    priorityFamilies: wilayahRecords.reduce((sum, item) => sum + item.priorityCount, 0),
  }
}

export function getWilayahBinaanRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  villageId = '',
  healthStatus = '',
} = {}) {
  const filtered = wilayahRecords
    .filter((record) => matchesKeyword({ ...record, rtRw: `RT ${record.rt} / RW ${record.rw}` }, search, ['rtRw', 'notes']))
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (villageId ? record.villageId === villageId : true))
    .filter((record) => (healthStatus ? record.healthStatus === healthStatus : true))
    .sort((a, b) => a.avgIks - b.avgIks)
    .map((record) => ({
      ...record,
      districtName: getDistrictName(record.districtId),
      villageName: getVillageName(record.villageId),
      coveragePct: Math.round((record.surveyedHouseholds / record.totalHouseholds) * 100),
    }))

  return paginate(filtered, page, perPage)
}

export function getKaderProfileData() {
  return {
    summary: profileSummary,
    activity: profileActivity,
  }
}

export function getTargetReportOptions({ districtId = '', puskesmasId = '' } = {}) {
  return {
    years: ['2025', '2026'],
    periods: [
      { value: 'semester-1', label: 'Semester I' },
      { value: 'semester-2', label: 'Semester II' },
      { value: 'triwulan-2', label: 'Triwulan II' },
    ],
    districts,
    puskesmas: districtId ? puskesmas.filter((item) => item.districtId === districtId) : puskesmas,
    villages: puskesmasId
      ? villages.filter((item) => item.puskesmasId === puskesmasId)
      : districtId
        ? villages.filter((item) => item.districtId === districtId)
        : villages,
  }
}

export function getAggregateReportStats(filteredRows = aggregateReportRows) {
  const totalFamilies = filteredRows.reduce((sum, item) => sum + item.totalFamilies, 0)
  const validatedFamilies = filteredRows.reduce((sum, item) => sum + item.validatedFamilies, 0)
  const priorityFamilies = filteredRows.reduce((sum, item) => sum + item.priorityFamilies, 0)
  const avgIks = filteredRows.length
    ? (filteredRows.reduce((sum, item) => sum + item.avgIks, 0) / filteredRows.length).toFixed(2)
    : '0.00'

  return {
    totalFamilies,
    validatedFamilies,
    priorityFamilies,
    avgIks,
    totalBacklog: filteredRows.reduce((sum, item) => sum + item.backlog, 0),
  }
}

export function getAggregateReportRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  puskesmasId = '',
  status = '',
} = {}) {
  const filtered = aggregateReportRows
    .filter((record) => matchesKeyword({
      ...record,
      districtName: getDistrictName(record.districtId),
      puskesmasName: getPuskesmasName(record.puskesmasId),
    }, search, ['districtName', 'puskesmasName']))
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (puskesmasId ? record.puskesmasId === puskesmasId : true))
    .filter((record) => (status ? record.status === status : true))
    .sort((a, b) => b.avgIks - a.avgIks)
    .map((record) => ({
      ...record,
      districtName: getDistrictName(record.districtId),
      puskesmasName: getPuskesmasName(record.puskesmasId),
    }))

  return paginate(filtered, page, perPage)
}

export function getDesaReportStats(filteredRows = desaReportRows) {
  const totalRespondents = filteredRows.reduce((sum, item) => sum + item.totalRespondents, 0)
  const totalBacklog = filteredRows.reduce((sum, item) => sum + item.backlog, 0)
  const avgIks = filteredRows.length
    ? (filteredRows.reduce((sum, item) => sum + item.avgIks, 0) / filteredRows.length).toFixed(2)
    : '0.00'
  const avgHealthy = filteredRows.length
    ? Math.round(filteredRows.reduce((sum, item) => sum + item.healthyPct, 0) / filteredRows.length)
    : 0

  return {
    villages: filteredRows.length,
    totalRespondents,
    totalBacklog,
    avgIks,
    avgHealthy,
  }
}

export function getDesaReportRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  puskesmasId = '',
  villageId = '',
  status = '',
} = {}) {
  const filtered = desaReportRows
    .filter((record) => matchesKeyword({
      ...record,
      villageName: getVillageName(record.villageId),
      districtName: getDistrictName(record.districtId),
      puskesmasName: getPuskesmasName(record.puskesmasId),
    }, search, ['villageName', 'districtName', 'puskesmasName', 'dominantIndicator']))
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (puskesmasId ? record.puskesmasId === puskesmasId : true))
    .filter((record) => (villageId ? record.villageId === villageId : true))
    .filter((record) => (status ? record.status === status : true))
    .sort((a, b) => b.totalRespondents - a.totalRespondents)
    .map((record) => ({
      ...record,
      districtName: getDistrictName(record.districtId),
      puskesmasName: getPuskesmasName(record.puskesmasId),
      villageName: getVillageName(record.villageId),
    }))

  return paginate(filtered, page, perPage)
}
