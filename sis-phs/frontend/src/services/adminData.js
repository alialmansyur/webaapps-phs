const validationRecords = [
  {
    id: 'SV-2026-0001',
    submittedAt: '2026-06-10T08:30:00+07:00',
    kaderName: 'Siti Aminah',
    puskesmasName: 'Puskesmas Sukamaju',
    districtId: '3201010',
    districtName: 'Kec. Sukamaju',
    villageId: '3201010001',
    villageName: 'Desa Sukamaju',
    householdNo: '3172012301000001',
    householdHead: 'Budi Santoso',
    respondentName: 'Rina Budi',
    respondentAge: 32,
    iksScore: 0.82,
    status: 'SUBMITTED',
    flaggedIndicators: ['Perokok aktif'],
    notes: 'Data lengkap, menunggu validasi Puskesmas.',
  },
  {
    id: 'SV-2026-0002',
    submittedAt: '2026-06-10T09:10:00+07:00',
    kaderName: 'Bambang Saputra',
    puskesmasName: 'Puskesmas Harapan',
    districtId: '3201011',
    districtName: 'Kec. Harapan',
    villageId: '3201011003',
    villageName: 'Desa Harapan Jaya',
    householdNo: '3172012301000002',
    householdHead: 'Joko Pranoto',
    respondentName: 'Nani Joko',
    respondentAge: 54,
    iksScore: 0.45,
    status: 'REVISION',
    flaggedIndicators: ['Hipertensi tidak terkontrol', 'Jamban sehat'],
    notes: 'Perlu lampiran ulang hasil kunjungan rumah.',
  },
  {
    id: 'SV-2026-0003',
    submittedAt: '2026-06-09T15:40:00+07:00',
    kaderName: 'Dewi Lestari',
    puskesmasName: 'Puskesmas Sukamaju',
    districtId: '3201010',
    districtName: 'Kec. Sukamaju',
    villageId: '3201010002',
    villageName: 'Desa Cempaka',
    householdNo: '3172012301000003',
    householdHead: 'Agus Salim',
    respondentName: 'Agus Salim',
    respondentAge: 47,
    iksScore: 0.38,
    status: 'SUBMITTED',
    flaggedIndicators: ['Merokok', 'TB belum rutin berobat'],
    notes: 'Prioritas intervensi tinggi.',
  },
  {
    id: 'SV-2026-0004',
    submittedAt: '2026-06-09T11:00:00+07:00',
    kaderName: 'Rahmawati',
    puskesmasName: 'Puskesmas Harapan',
    districtId: '3201011',
    districtName: 'Kec. Harapan',
    villageId: '3201011001',
    villageName: 'Desa Mekar',
    householdNo: '3172012301000004',
    householdHead: 'Sulastri',
    respondentName: 'Sulastri',
    respondentAge: 29,
    iksScore: 0.91,
    status: 'APPROVED',
    flaggedIndicators: [],
    notes: 'Sudah divalidasi tanpa catatan.',
  },
  {
    id: 'SV-2026-0005',
    submittedAt: '2026-06-08T13:20:00+07:00',
    kaderName: 'Fajar Nugroho',
    puskesmasName: 'Puskesmas Sukamaju',
    districtId: '3201010',
    districtName: 'Kec. Sukamaju',
    villageId: '3201010001',
    villageName: 'Desa Sukamaju',
    householdNo: '3172012301000005',
    householdHead: 'Nurhayati',
    respondentName: 'Nurhayati',
    respondentAge: 61,
    iksScore: 0.52,
    status: 'REJECTED',
    flaggedIndicators: ['NIK tidak valid'],
    notes: 'Ditolak karena duplikasi keluarga.',
  },
  {
    id: 'SV-2026-0006',
    submittedAt: '2026-06-08T10:45:00+07:00',
    kaderName: 'Mila Kurnia',
    puskesmasName: 'Puskesmas Cempaka',
    districtId: '3201012',
    districtName: 'Kec. Cempaka',
    villageId: '3201012004',
    villageName: 'Desa Cempaka Indah',
    householdNo: '3172012301000006',
    householdHead: 'Wawan Setiawan',
    respondentName: 'Wawan Setiawan',
    respondentAge: 36,
    iksScore: 0.66,
    status: 'SUBMITTED',
    flaggedIndicators: ['Air bersih'],
    notes: 'Menunggu review admin.',
  },
]

const statusMeta = {
  SUBMITTED: { label: 'Menunggu Validasi', tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
  APPROVED: { label: 'Disetujui', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  REVISION: { label: 'Perlu Revisi', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  REJECTED: { label: 'Ditolak', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
}

const districts = [
  { id: '3201010', name: 'Kec. Sukamaju' },
  { id: '3201011', name: 'Kec. Harapan' },
  { id: '3201012', name: 'Kec. Cempaka' },
]

const villages = [
  { id: '3201010001', districtId: '3201010', name: 'Desa Sukamaju' },
  { id: '3201010002', districtId: '3201010', name: 'Desa Cempaka' },
  { id: '3201011001', districtId: '3201011', name: 'Desa Mekar' },
  { id: '3201011003', districtId: '3201011', name: 'Desa Harapan Jaya' },
  { id: '3201012004', districtId: '3201012', name: 'Desa Cempaka Indah' },
]

function matchesKeyword(record, keyword) {
  if (!keyword) return true

  const haystack = [
    record.id,
    record.kaderName,
    record.householdHead,
    record.respondentName,
    record.villageName,
    record.puskesmasName,
  ].join(' ').toLowerCase()

  return haystack.includes(keyword.toLowerCase())
}

export function getSurveyValidationOptions() {
  const puskesmas = Array.from(new Set(validationRecords.map((record) => record.puskesmasName))).map((name) => ({
    value: name,
    label: name,
  }))

  return {
    districts,
    villages,
    puskesmas,
    statuses: Object.entries(statusMeta).map(([value, meta]) => ({
      value,
      label: meta.label,
    })),
  }
}

export function getSurveyValidationStats(records = validationRecords) {
  const pending = records.filter((item) => item.status === 'SUBMITTED').length
  const approved = records.filter((item) => item.status === 'APPROVED').length
  const revisions = records.filter((item) => item.status === 'REVISION').length
  const highRisk = records.filter((item) => item.iksScore < 0.5).length

  return {
    total: records.length,
    pending,
    approved,
    revisions,
    highRisk,
  }
}

export function getSurveyValidationRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  villageId = '',
  puskesmasName = '',
  status = '',
} = {}) {
  const filtered = validationRecords
    .filter((record) => matchesKeyword(record, search))
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (villageId ? record.villageId === villageId : true))
    .filter((record) => (puskesmasName ? record.puskesmasName === puskesmasName : true))
    .filter((record) => (status ? record.status === status : true))
    .sort((left, right) => new Date(right.submittedAt) - new Date(left.submittedAt))

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * perPage
  const data = filtered.slice(start, start + perPage)

  return {
    data,
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

export function getSurveyValidationStatusMeta(status) {
  return statusMeta[status] || statusMeta.SUBMITTED
}

const householdRecords = [
  {
    id: 1,
    noKk: '3172012301000001',
    headOfFamilyName: 'Budi Santoso',
    districtId: '3201010',
    districtName: 'Kec. Sukamaju',
    villageId: '3201010001',
    villageName: 'Desa Sukamaju',
    rt: '01',
    rw: '02',
    puskesmasName: 'Puskesmas Sukamaju',
    respondentCount: 4,
    latestSurveyDate: '2026-06-10T08:30:00+07:00',
    latestIksScore: 0.82,
    healthStatus: 'SEHAT',
    interventionStatus: 'Tidak perlu',
  },
  {
    id: 2,
    noKk: '3172012301000002',
    headOfFamilyName: 'Joko Pranoto',
    districtId: '3201011',
    districtName: 'Kec. Harapan',
    villageId: '3201011003',
    villageName: 'Desa Harapan Jaya',
    rt: '03',
    rw: '05',
    puskesmasName: 'Puskesmas Harapan',
    respondentCount: 5,
    latestSurveyDate: '2026-06-10T09:10:00+07:00',
    latestIksScore: 0.45,
    healthStatus: 'TIDAK_SEHAT',
    interventionStatus: 'Perlu kunjungan ulang',
  },
  {
    id: 3,
    noKk: '3172012301000003',
    headOfFamilyName: 'Agus Salim',
    districtId: '3201010',
    districtName: 'Kec. Sukamaju',
    villageId: '3201010002',
    villageName: 'Desa Cempaka',
    rt: '02',
    rw: '01',
    puskesmasName: 'Puskesmas Sukamaju',
    respondentCount: 3,
    latestSurveyDate: '2026-06-09T15:40:00+07:00',
    latestIksScore: 0.38,
    healthStatus: 'TIDAK_SEHAT',
    interventionStatus: 'Prioritas tinggi',
  },
  {
    id: 4,
    noKk: '3172012301000004',
    headOfFamilyName: 'Sulastri',
    districtId: '3201011',
    districtName: 'Kec. Harapan',
    villageId: '3201011001',
    villageName: 'Desa Mekar',
    rt: '04',
    rw: '03',
    puskesmasName: 'Puskesmas Harapan',
    respondentCount: 2,
    latestSurveyDate: '2026-06-09T11:00:00+07:00',
    latestIksScore: 0.91,
    healthStatus: 'SEHAT',
    interventionStatus: 'Tidak perlu',
  },
  {
    id: 5,
    noKk: '3172012301000005',
    headOfFamilyName: 'Nurhayati',
    districtId: '3201010',
    districtName: 'Kec. Sukamaju',
    villageId: '3201010001',
    villageName: 'Desa Sukamaju',
    rt: '06',
    rw: '02',
    puskesmasName: 'Puskesmas Sukamaju',
    respondentCount: 6,
    latestSurveyDate: '2026-06-08T13:20:00+07:00',
    latestIksScore: 0.52,
    healthStatus: 'TIDAK_SEHAT',
    interventionStatus: 'Monitoring',
  },
  {
    id: 6,
    noKk: '3172012301000006',
    headOfFamilyName: 'Wawan Setiawan',
    districtId: '3201012',
    districtName: 'Kec. Cempaka',
    villageId: '3201012004',
    villageName: 'Desa Cempaka Indah',
    rt: '01',
    rw: '04',
    puskesmasName: 'Puskesmas Cempaka',
    respondentCount: 4,
    latestSurveyDate: '2026-06-08T10:45:00+07:00',
    latestIksScore: 0.66,
    healthStatus: 'TIDAK_SEHAT',
    interventionStatus: 'Perlu edukasi',
  },
]

const householdStatusMeta = {
  SEHAT: { label: 'Sehat', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  TIDAK_SEHAT: { label: 'Tidak Sehat', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
}

const kaderUsers = [
  {
    id: 11,
    code: 'KDR-0011',
    fullName: 'Siti Aminah',
    username: 'siti.aminah',
    districtId: '3201010',
    districtName: 'Kec. Sukamaju',
    villageId: '3201010001',
    villageName: 'Desa Sukamaju',
    puskesmasId: 1,
    puskesmasName: 'Puskesmas Sukamaju',
    isActive: true,
    coverageArea: 'RT 01-03 / RW 02',
    phone: '081234567890',
    surveyCount: 142,
    lastSyncAt: '2026-06-10T08:00:00+07:00',
  },
  {
    id: 12,
    code: 'KDR-0012',
    fullName: 'Bambang Saputra',
    username: 'bambang.saputra',
    districtId: '3201011',
    districtName: 'Kec. Harapan',
    villageId: '3201011003',
    villageName: 'Desa Harapan Jaya',
    puskesmasId: 2,
    puskesmasName: 'Puskesmas Harapan',
    isActive: true,
    coverageArea: 'RT 01-02 / RW 05',
    phone: '081298765432',
    surveyCount: 96,
    lastSyncAt: '2026-06-10T07:42:00+07:00',
  },
  {
    id: 13,
    code: 'KDR-0013',
    fullName: 'Dewi Lestari',
    username: 'dewi.lestari',
    districtId: '3201010',
    districtName: 'Kec. Sukamaju',
    villageId: '3201010002',
    villageName: 'Desa Cempaka',
    puskesmasId: 1,
    puskesmasName: 'Puskesmas Sukamaju',
    isActive: false,
    coverageArea: 'RT 02-04 / RW 01',
    phone: '082112223334',
    surveyCount: 77,
    lastSyncAt: '2026-06-06T15:30:00+07:00',
  },
  {
    id: 14,
    code: 'KDR-0014',
    fullName: 'Rahmawati',
    username: 'rahmawati',
    districtId: '3201011',
    districtName: 'Kec. Harapan',
    villageId: '3201011001',
    villageName: 'Desa Mekar',
    puskesmasId: 2,
    puskesmasName: 'Puskesmas Harapan',
    isActive: true,
    coverageArea: 'RT 03-06 / RW 03',
    phone: '082198887766',
    surveyCount: 121,
    lastSyncAt: '2026-06-10T09:10:00+07:00',
  },
  {
    id: 15,
    code: 'KDR-0015',
    fullName: 'Mila Kurnia',
    username: 'mila.kurnia',
    districtId: '3201012',
    districtName: 'Kec. Cempaka',
    villageId: '3201012004',
    villageName: 'Desa Cempaka Indah',
    puskesmasId: 3,
    puskesmasName: 'Puskesmas Cempaka',
    isActive: true,
    coverageArea: 'RT 01-02 / RW 04',
    phone: '081377788899',
    surveyCount: 84,
    lastSyncAt: '2026-06-09T16:20:00+07:00',
  },
]

const puskesmasOptions = [
  { id: 1, districtId: '3201010', name: 'Puskesmas Sukamaju' },
  { id: 2, districtId: '3201011', name: 'Puskesmas Harapan' },
  { id: 3, districtId: '3201012', name: 'Puskesmas Cempaka' },
]

function paginateRecords(records, page, perPage) {
  const total = records.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * perPage

  return {
    data: records.slice(start, start + perPage),
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

export function getHouseholdStatusMeta(status) {
  return householdStatusMeta[status] || householdStatusMeta.TIDAK_SEHAT
}

export function getSurveyDatabaseOptions() {
  return {
    districts,
    villages,
    statuses: Object.entries(householdStatusMeta).map(([value, meta]) => ({
      value,
      label: meta.label,
    })),
    puskesmas: puskesmasOptions,
  }
}

export function getSurveyDatabaseStats(records = householdRecords) {
  return {
    totalHouseholds: records.length,
    healthyCount: records.filter((record) => record.healthStatus === 'SEHAT').length,
    followUpCount: records.filter((record) => record.healthStatus !== 'SEHAT').length,
    averageRespondents: (records.reduce((sum, record) => sum + record.respondentCount, 0) / records.length).toFixed(1),
  }
}

export function getSurveyDatabaseRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  villageId = '',
  puskesmasId = '',
  healthStatus = '',
} = {}) {
  const filtered = householdRecords
    .filter((record) => {
      if (!search) return true
      const haystack = [
        record.noKk,
        record.headOfFamilyName,
        record.villageName,
        record.puskesmasName,
      ].join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (villageId ? record.villageId === villageId : true))
    .filter((record) => (puskesmasId ? String(record.puskesmasId) === String(puskesmasId) : true))
    .filter((record) => (healthStatus ? record.healthStatus === healthStatus : true))
    .sort((left, right) => new Date(right.latestSurveyDate) - new Date(left.latestSurveyDate))

  return paginateRecords(filtered, page, perPage)
}

export function getUserKaderOptions() {
  return {
    districts,
    villages,
    puskesmas: puskesmasOptions,
    statuses: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
  }
}

export function getUserKaderStats(records = kaderUsers) {
  return {
    total: records.length,
    active: records.filter((record) => record.isActive).length,
    inactive: records.filter((record) => !record.isActive).length,
    totalSurveys: records.reduce((sum, record) => sum + record.surveyCount, 0),
  }
}

export function getUserKaderRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  villageId = '',
  puskesmasId = '',
  status = '',
} = {}) {
  const filtered = kaderUsers
    .filter((record) => {
      if (!search) return true
      const haystack = [
        record.code,
        record.fullName,
        record.username,
        record.puskesmasName,
        record.villageName,
      ].join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (villageId ? record.villageId === villageId : true))
    .filter((record) => (puskesmasId ? String(record.puskesmasId) === String(puskesmasId) : true))
    .filter((record) => {
      if (!status) return true
      return status === 'active' ? record.isActive : !record.isActive
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName))

  return paginateRecords(filtered, page, perPage)
}

const regionRecords = [
  { id: '32', code: '32', level: 'PROVINSI', name: 'Jawa Barat', parentId: null, parentName: '-', childCount: 1, puskesmasCoverage: 3, isActive: true },
  { id: '3201', code: '32.01', level: 'KABUPATEN', name: 'Kabupaten Bogor', parentId: '32', parentName: 'Jawa Barat', childCount: 3, puskesmasCoverage: 3, isActive: true },
  { id: '3201010', code: '32.01.010', level: 'KECAMATAN', name: 'Sukamaju', parentId: '3201', parentName: 'Kabupaten Bogor', childCount: 2, puskesmasCoverage: 1, isActive: true },
  { id: '3201011', code: '32.01.011', level: 'KECAMATAN', name: 'Harapan', parentId: '3201', parentName: 'Kabupaten Bogor', childCount: 2, puskesmasCoverage: 1, isActive: true },
  { id: '3201012', code: '32.01.012', level: 'KECAMATAN', name: 'Cempaka', parentId: '3201', parentName: 'Kabupaten Bogor', childCount: 1, puskesmasCoverage: 1, isActive: true },
  { id: '3201010001', code: '32.01.010.001', level: 'DESA', name: 'Desa Sukamaju', parentId: '3201010', parentName: 'Sukamaju', childCount: 0, puskesmasCoverage: 1, isActive: true },
  { id: '3201010002', code: '32.01.010.002', level: 'DESA', name: 'Desa Cempaka', parentId: '3201010', parentName: 'Sukamaju', childCount: 0, puskesmasCoverage: 1, isActive: true },
  { id: '3201011001', code: '32.01.011.001', level: 'DESA', name: 'Desa Mekar', parentId: '3201011', parentName: 'Harapan', childCount: 0, puskesmasCoverage: 1, isActive: true },
  { id: '3201011003', code: '32.01.011.003', level: 'DESA', name: 'Desa Harapan Jaya', parentId: '3201011', parentName: 'Harapan', childCount: 0, puskesmasCoverage: 1, isActive: false },
  { id: '3201012004', code: '32.01.012.004', level: 'DESA', name: 'Desa Cempaka Indah', parentId: '3201012', parentName: 'Cempaka', childCount: 0, puskesmasCoverage: 1, isActive: true },
]

const regionLevelMeta = {
  PROVINSI: { label: 'Provinsi', tone: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' },
  KABUPATEN: { label: 'Kabupaten', tone: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300' },
  KECAMATAN: { label: 'Kecamatan', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  DESA: { label: 'Desa', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
}

export function getRegionLevelMeta(level) {
  return regionLevelMeta[level] || regionLevelMeta.DESA
}

export function getMasterRegionOptions() {
  return {
    levels: Object.entries(regionLevelMeta).map(([value, meta]) => ({
      value,
      label: meta.label,
    })),
    statuses: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    parents: regionRecords.map((record) => ({
      value: record.id,
      label: `${record.code} - ${record.name}`,
      level: record.level,
    })),
    nodeTypes: [
      { value: 'ROOT', label: 'Node Induk' },
      { value: 'LEAF', label: 'Node Akhir' },
    ],
  }
}

export function getMasterRegionStats(records = regionRecords) {
  return {
    total: records.length,
    active: records.filter((record) => record.isActive).length,
    districts: records.filter((record) => record.level === 'KECAMATAN').length,
    villages: records.filter((record) => record.level === 'DESA').length,
  }
}

export function getMasterRegionRecords({
  page = 1,
  perPage = 5,
  search = '',
  level = '',
  status = '',
  parentId = '',
  nodeType = '',
} = {}) {
  const filtered = regionRecords
    .filter((record) => {
      if (!search) return true
      const haystack = [record.code, record.name, record.parentName].join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
    .filter((record) => (level ? record.level === level : true))
    .filter((record) => {
      if (!status) return true
      return status === 'active' ? record.isActive : !record.isActive
    })
    .filter((record) => (parentId ? record.parentId === parentId : true))
    .filter((record) => {
      if (!nodeType) return true
      return nodeType === 'ROOT' ? record.childCount > 0 : record.childCount === 0
    })
    .sort((left, right) => left.code.localeCompare(right.code))

  return paginateRecords(filtered, page, perPage)
}

const faskesRecords = [
  {
    id: 1,
    code: 'PKM-3201010',
    name: 'Puskesmas Sukamaju',
    type: 'PUSKESMAS',
    districtId: '3201010',
    districtName: 'Sukamaju',
    regencyName: 'Kabupaten Bogor',
    villageFocus: 'Desa Sukamaju, Desa Cempaka',
    address: 'Jl. Raya Sukamaju No. 12',
    phone: '0251-111222',
    isActive: true,
    cadreCount: 2,
    householdCoverage: 3,
  },
  {
    id: 2,
    code: 'PKM-3201011',
    name: 'Puskesmas Harapan',
    type: 'PUSKESMAS',
    districtId: '3201011',
    districtName: 'Harapan',
    regencyName: 'Kabupaten Bogor',
    villageFocus: 'Desa Mekar, Desa Harapan Jaya',
    address: 'Jl. Harapan Sehat No. 5',
    phone: '0251-222333',
    isActive: true,
    cadreCount: 2,
    householdCoverage: 2,
  },
  {
    id: 3,
    code: 'PKM-3201012',
    name: 'Puskesmas Cempaka',
    type: 'PUSKESMAS',
    districtId: '3201012',
    districtName: 'Cempaka',
    regencyName: 'Kabupaten Bogor',
    villageFocus: 'Desa Cempaka Indah',
    address: 'Jl. Melati No. 8',
    phone: '0251-333444',
    isActive: true,
    cadreCount: 1,
    householdCoverage: 1,
  },
  {
    id: 4,
    code: 'PST-3201010-01',
    name: 'Pustu Desa Sukamaju',
    type: 'PUSTU',
    districtId: '3201010',
    districtName: 'Sukamaju',
    regencyName: 'Kabupaten Bogor',
    villageFocus: 'Desa Sukamaju',
    address: 'Jl. RT 01 RW 02',
    phone: '0251-111999',
    isActive: true,
    cadreCount: 1,
    householdCoverage: 2,
  },
  {
    id: 5,
    code: 'POS-3201011-01',
    name: 'Poskesdes Harapan Jaya',
    type: 'POSKESDES',
    districtId: '3201011',
    districtName: 'Harapan',
    regencyName: 'Kabupaten Bogor',
    villageFocus: 'Desa Harapan Jaya',
    address: 'Jl. Jaya Mandiri No. 3',
    phone: '0251-222999',
    isActive: false,
    cadreCount: 0,
    householdCoverage: 1,
  },
]

const faskesTypeMeta = {
  PUSKESMAS: { label: 'Puskesmas', tone: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300' },
  PUSTU: { label: 'Puskesmas Pembantu', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  POSKESDES: { label: 'Poskesdes', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
}

export function getFaskesTypeMeta(type) {
  return faskesTypeMeta[type] || faskesTypeMeta.PUSKESMAS
}

export function getMasterFaskesOptions() {
  return {
    districts,
    statuses: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    types: Object.entries(faskesTypeMeta).map(([value, meta]) => ({
      value,
      label: meta.label,
    })),
    cadreStatuses: [
      { value: 'WITH_CADRE', label: 'Sudah Ada Kader' },
      { value: 'WITHOUT_CADRE', label: 'Belum Ada Kader' },
    ],
  }
}

export function getMasterFaskesStats(records = faskesRecords) {
  return {
    total: records.length,
    active: records.filter((record) => record.isActive).length,
    puskesmas: records.filter((record) => record.type === 'PUSKESMAS').length,
    supporting: records.filter((record) => record.type !== 'PUSKESMAS').length,
  }
}

export function getMasterFaskesRecords({
  page = 1,
  perPage = 5,
  search = '',
  districtId = '',
  status = '',
  type = '',
  cadreStatus = '',
} = {}) {
  const filtered = faskesRecords
    .filter((record) => {
      if (!search) return true
      const haystack = [
        record.code,
        record.name,
        record.districtName,
        record.villageFocus,
      ].join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (type ? record.type === type : true))
    .filter((record) => {
      if (!cadreStatus) return true
      return cadreStatus === 'WITH_CADRE' ? record.cadreCount > 0 : record.cadreCount === 0
    })
    .filter((record) => {
      if (!status) return true
      return status === 'active' ? record.isActive : !record.isActive
    })
    .sort((left, right) => left.name.localeCompare(right.name))

  return paginateRecords(filtered, page, perPage)
}

const internalAdminUsers = [
  {
    id: 101,
    username: 'super.admin',
    fullName: 'Nadia Permatasari',
    role: 'ADMIN_PUSAT',
    roleLabel: 'Admin Pusat',
    scopeType: 'KABUPATEN',
    scopeLabel: 'Kabupaten Bogor',
    institution: 'Dinas Kesehatan Kabupaten Bogor',
    puskesmasId: null,
    districtId: '',
    isActive: true,
    lastLoginAt: '2026-06-10T08:20:00+07:00',
    email: 'nadia.permatasari@sisphs.local',
    phone: '081234560001',
  },
  {
    id: 102,
    username: 'dinkes.bogor',
    fullName: 'Budi Prasetyo, M.Kes',
    role: 'ADMIN_DINKES',
    roleLabel: 'Admin Dinkes',
    scopeType: 'KABUPATEN',
    scopeLabel: 'Kabupaten Bogor',
    institution: 'Dinas Kesehatan Kabupaten Bogor',
    puskesmasId: null,
    districtId: '',
    isActive: true,
    lastLoginAt: '2026-06-10T07:45:00+07:00',
    email: 'budi.prasetyo@sisphs.local',
    phone: '081234560002',
  },
  {
    id: 103,
    username: 'pkm.sukamaju',
    fullName: 'dr. Andi Saputra',
    role: 'ADMIN_PUSKESMAS',
    roleLabel: 'Admin Puskesmas',
    scopeType: 'PUSKESMAS',
    scopeLabel: 'Puskesmas Sukamaju',
    institution: 'Puskesmas Sukamaju',
    puskesmasId: 1,
    districtId: '3201010',
    isActive: true,
    lastLoginAt: '2026-06-09T15:10:00+07:00',
    email: 'andi.saputra@sisphs.local',
    phone: '081234560003',
  },
  {
    id: 104,
    username: 'pkm.harapan',
    fullName: 'drg. Maya Lestari',
    role: 'ADMIN_PUSKESMAS',
    roleLabel: 'Admin Puskesmas',
    scopeType: 'PUSKESMAS',
    scopeLabel: 'Puskesmas Harapan',
    institution: 'Puskesmas Harapan',
    puskesmasId: 2,
    districtId: '3201011',
    isActive: false,
    lastLoginAt: '2026-06-04T10:00:00+07:00',
    email: 'maya.lestari@sisphs.local',
    phone: '081234560004',
  },
  {
    id: 105,
    username: 'analis.surveillance',
    fullName: 'Rani Kurniawati',
    role: 'ANALIS',
    roleLabel: 'Analis Data',
    scopeType: 'KABUPATEN',
    scopeLabel: 'Kabupaten Bogor',
    institution: 'Dinas Kesehatan Kabupaten Bogor',
    puskesmasId: null,
    districtId: '',
    isActive: true,
    lastLoginAt: '2026-06-10T09:05:00+07:00',
    email: 'rani.kurniawati@sisphs.local',
    phone: '081234560005',
  },
]

const internalRoleOptions = [
  { value: 'ADMIN_PUSAT', label: 'Admin Pusat' },
  { value: 'ADMIN_DINKES', label: 'Admin Dinkes' },
  { value: 'ADMIN_PUSKESMAS', label: 'Admin Puskesmas' },
  { value: 'ANALIS', label: 'Analis Data' },
]

export function getUserAdminOptions() {
  return {
    roles: internalRoleOptions,
    statuses: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    districts,
    puskesmas: puskesmasOptions
      .filter((item) => item.name.toLowerCase().includes('puskesmas')),
  }
}

export function getUserAdminStats(records = internalAdminUsers) {
  return {
    total: records.length,
    active: records.filter((record) => record.isActive).length,
    puskesmasAdmins: records.filter((record) => record.role === 'ADMIN_PUSKESMAS').length,
    districtLevel: records.filter((record) => record.scopeType === 'KABUPATEN').length,
  }
}

export function getUserAdminRecords({
  page = 1,
  perPage = 5,
  search = '',
  role = '',
  status = '',
  districtId = '',
  puskesmasId = '',
} = {}) {
  const filtered = internalAdminUsers
    .filter((record) => {
      if (!search) return true
      const haystack = [
        record.username,
        record.fullName,
        record.roleLabel,
        record.institution,
        record.scopeLabel,
      ].join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
    .filter((record) => (role ? record.role === role : true))
    .filter((record) => {
      if (!status) return true
      return status === 'active' ? record.isActive : !record.isActive
    })
    .filter((record) => (districtId ? record.districtId === districtId : true))
    .filter((record) => (puskesmasId ? String(record.puskesmasId) === String(puskesmasId) : true))
    .sort((left, right) => left.fullName.localeCompare(right.fullName))

  return paginateRecords(filtered, page, perPage)
}

const questionRecords = [
  {
    id: 1,
    code: 'PHS-01',
    indicator: 'Keluarga Berencana',
    questionText: 'Apakah keluarga mengikuti program Keluarga Berencana (KB)?',
    inputType: 'RADIO',
    minAge: 0,
    isActive: true,
    optionCount: 2,
    questionnaireTitle: 'Kuesioner PHS 2026',
    mandatory: true,
  },
  {
    id: 2,
    code: 'PHS-03',
    indicator: 'Imunisasi Dasar Lengkap',
    questionText: 'Apakah bayi mendapat imunisasi dasar lengkap?',
    inputType: 'RADIO',
    minAge: 0,
    isActive: true,
    optionCount: 2,
    questionnaireTitle: 'Kuesioner PHS 2026',
    mandatory: true,
  },
  {
    id: 3,
    code: 'PHS-05',
    indicator: 'Pemantauan Pertumbuhan',
    questionText: 'Apakah balita mendapatkan pemantauan pertumbuhan?',
    inputType: 'RADIO',
    minAge: 0,
    isActive: true,
    optionCount: 2,
    questionnaireTitle: 'Kuesioner PHS 2026',
    mandatory: true,
  },
  {
    id: 4,
    code: 'PHS-09',
    indicator: 'Perilaku Merokok',
    questionText: 'Apakah anggota keluarga tidak ada yang merokok?',
    inputType: 'RADIO',
    minAge: 10,
    isActive: false,
    optionCount: 2,
    questionnaireTitle: 'Kuesioner PHS 2025',
    mandatory: true,
  },
  {
    id: 5,
    code: 'PHS-11',
    indicator: 'Akses Air Bersih',
    questionText: 'Apakah keluarga mempunyai akses sarana air bersih?',
    inputType: 'RADIO',
    minAge: 0,
    isActive: true,
    optionCount: 2,
    questionnaireTitle: 'Kuesioner PHS 2026',
    mandatory: true,
  },
]

const scoringRules = [
  {
    id: 1,
    name: 'All-or-Nothing IKS',
    questionnaireTitle: 'Kuesioner PHS 2026',
    formulaType: 'ALL_OR_NOTHING',
    weightRule: '1/N indikator applicable',
    notApplicableRule: 'Indikator dikecualikan jika tidak applicable berdasarkan umur/kondisi responden.',
    passingLogic: 'Keluarga sehat bila semua indikator applicable bernilai positif.',
    isActive: true,
    version: 'v2026.1',
  },
  {
    id: 2,
    name: 'Rule Perokok 10+',
    questionnaireTitle: 'Kuesioner PHS 2026',
    formulaType: 'CONDITIONAL_FILTER',
    weightRule: 'Aktif hanya jika ada anggota umur >= 10 tahun.',
    notApplicableRule: 'Jika semua anggota < 10 tahun, indikator otomatis dikeluarkan dari penyebut.',
    passingLogic: 'Jawaban "Ya" menambah status sehat untuk indikator terkait.',
    isActive: true,
    version: 'v2026.1',
  },
  {
    id: 3,
    name: 'Legacy Scoring 2025',
    questionnaireTitle: 'Kuesioner PHS 2025',
    formulaType: 'ALL_OR_NOTHING',
    weightRule: '1/N indikator applicable',
    notApplicableRule: 'Mengacu pada aturan lama sebelum sinkronisasi 2026.',
    passingLogic: 'Digunakan hanya untuk histori pelaporan.',
    isActive: false,
    version: 'v2025.3',
  },
]

const questionnaireOptions = [
  { value: 'Kuesioner PHS 2026', label: 'Kuesioner PHS 2026' },
  { value: 'Kuesioner PHS 2025', label: 'Kuesioner PHS 2025' },
]

export function getMasterQuestionsOptions() {
  return {
    inputTypes: [
      { value: 'RADIO', label: 'Radio / Ya-Tidak' },
      { value: 'CHECKBOX', label: 'Checkbox' },
      { value: 'NUMBER', label: 'Number' },
      { value: 'TEXT', label: 'Text' },
    ],
    statuses: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    questionnaires: questionnaireOptions,
    mandatoryOptions: [
      { value: 'MANDATORY', label: 'Wajib' },
      { value: 'OPTIONAL', label: 'Opsional' },
    ],
  }
}

export function getMasterQuestionsStats(records = questionRecords) {
  return {
    total: records.length,
    active: records.filter((record) => record.isActive).length,
    ageFiltered: records.filter((record) => record.minAge > 0).length,
    totalOptions: records.reduce((sum, record) => sum + record.optionCount, 0),
  }
}

export function getMasterQuestionsRecords({
  page = 1,
  perPage = 5,
  search = '',
  inputType = '',
  status = '',
  questionnaire = '',
  mandatory = '',
} = {}) {
  const filtered = questionRecords
    .filter((record) => {
      if (!search) return true
      const haystack = [
        record.code,
        record.indicator,
        record.questionText,
        record.questionnaireTitle,
      ].join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
    .filter((record) => (inputType ? record.inputType === inputType : true))
    .filter((record) => {
      if (!status) return true
      return status === 'active' ? record.isActive : !record.isActive
    })
    .filter((record) => (questionnaire ? record.questionnaireTitle === questionnaire : true))
    .filter((record) => {
      if (!mandatory) return true
      return mandatory === 'MANDATORY' ? record.mandatory : !record.mandatory
    })
    .sort((left, right) => left.code.localeCompare(right.code))

  return paginateRecords(filtered, page, perPage)
}

export function getMasterScoringOptions() {
  const versions = Array.from(new Set(scoringRules.map((record) => record.version))).sort((left, right) => right.localeCompare(left, 'id-ID'))

  return {
    formulaTypes: [
      { value: 'ALL_OR_NOTHING', label: 'All or Nothing' },
      { value: 'CONDITIONAL_FILTER', label: 'Conditional Filter' },
    ],
    statuses: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    questionnaires: questionnaireOptions,
    versions: versions.map((value) => ({ value, label: value })),
  }
}

export function getMasterScoringStats(records = scoringRules) {
  return {
    total: records.length,
    active: records.filter((record) => record.isActive).length,
    questionnaireCount: new Set(records.map((record) => record.questionnaireTitle)).size,
    formulaTypes: new Set(records.map((record) => record.formulaType)).size,
  }
}

export function getMasterScoringRecords({
  page = 1,
  perPage = 5,
  search = '',
  formulaType = '',
  status = '',
  questionnaire = '',
  version = '',
} = {}) {
  const filtered = scoringRules
    .filter((record) => {
      if (!search) return true
      const haystack = [
        record.name,
        record.questionnaireTitle,
        record.weightRule,
        record.version,
      ].join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
    .filter((record) => (formulaType ? record.formulaType === formulaType : true))
    .filter((record) => {
      if (!status) return true
      return status === 'active' ? record.isActive : !record.isActive
    })
    .filter((record) => (questionnaire ? record.questionnaireTitle === questionnaire : true))
    .filter((record) => (version ? record.version === version : true))
    .sort((left, right) => left.name.localeCompare(right.name))

  return paginateRecords(filtered, page, perPage)
}
