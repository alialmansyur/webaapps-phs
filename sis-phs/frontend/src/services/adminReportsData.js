import { apiRequest } from './api';

const districts = [
  { id: 'dist-pacet', name: 'Kec. Pacet' },
  { id: 'dist-paseh', name: 'Kec. Paseh' },
  { id: 'dist-pangalengan', name: 'Kec. Pangalengan' },
  { id: 'dist-katapang', name: 'Kec. Katapang' },
]

const puskesmas = [
  { id: 'pkm-pacet', districtId: 'dist-pacet', name: 'Puskesmas Pacet' },
  { id: 'pkm-paseh', districtId: 'dist-paseh', name: 'Puskesmas Paseh' },
  { id: 'pkm-sukamanah', districtId: 'dist-pangalengan', name: 'Puskesmas Sukamanah' },
  { id: 'pkm-sangkanhurip', districtId: 'dist-katapang', name: 'Puskesmas Sangkanhurip' },
]

const villages = [
  { id: 'vlg-girimulya', districtId: 'dist-pacet', puskesmasId: 'pkm-pacet', name: 'Desa Girimulya' },
  { id: 'vlg-cinanggela', districtId: 'dist-pacet', puskesmasId: 'pkm-pacet', name: 'Desa Cinanggela' },
  { id: 'vlg-sindangsari', districtId: 'dist-paseh', puskesmasId: 'pkm-paseh', name: 'Desa Sindangsari' },
  { id: 'vlg-sukamantri', districtId: 'dist-paseh', puskesmasId: 'pkm-paseh', name: 'Desa Sukamantri' },
  { id: 'vlg-margamukti', districtId: 'dist-pangalengan', puskesmasId: 'pkm-sukamanah', name: 'Desa Margamukti' },
  { id: 'vlg-wanasuka', districtId: 'dist-pangalengan', puskesmasId: 'pkm-sukamanah', name: 'Desa Wanasuka' },
  { id: 'vlg-gandasari', districtId: 'dist-katapang', puskesmasId: 'pkm-sangkanhurip', name: 'Desa Gandasari' },
  { id: 'vlg-banyusari', districtId: 'dist-katapang', puskesmasId: 'pkm-sangkanhurip', name: 'Desa Banyusari' },
]

const years = ['2025', '2026']
const periods = [
  { value: 'semester-1', label: 'Semester I' },
  { value: 'semester-2', label: 'Semester II' },
  { value: 'triwulan-2', label: 'Triwulan II' },
]

const progressStatuses = [
  { value: 'on-track', label: 'On Track' },
  { value: 'follow-up', label: 'Perlu Follow Up' },
  { value: 'critical', label: 'Tertinggal' },
]

const respondentTypes = [
  { value: 'art-5', label: 'ART usia >= 5 tahun' },
  { value: 'art-10', label: 'ART usia >= 10 tahun' },
  { value: 'art-15', label: 'ART usia >= 15 tahun' },
]

const validationStatuses = [
  { value: 'all', label: 'Semua Status Validasi' },
  { value: 'validated', label: 'Sudah tervalidasi' },
  { value: 'pending', label: 'Menunggu validasi' },
]

const indicatorOptions = [
  { value: 'Aktivitas Fisik', label: 'Aktivitas fisik' },
  { value: 'Cuci Tangan', label: 'Cuci tangan benar' },
  { value: 'Konsumsi Buah dan/atau Sayur', label: 'Konsumsi buah dan sayur' },
  { value: 'Tidak Merokok / Berhenti Merokok', label: 'Tidak merokok' },
  { value: 'Pengukuran Tekanan Darah', label: 'Cek tekanan darah' },
  { value: 'Pengukuran Gula Darah', label: 'Cek gula darah' },
]

const iksLevels = [
  { value: 'district', label: 'Kecamatan' },
  { value: 'puskesmas', label: 'Puskesmas' },
  { value: 'village', label: 'Desa/Kelurahan' },
]

const rankingStatuses = [
  { value: 'excellent', label: 'Sangat Baik' },
  { value: 'stable', label: 'Stabil' },
  { value: 'alert', label: 'Perlu Perhatian' },
  { value: 'priority', label: 'Prioritas Intervensi' },
]






function toLower(value) {
  return String(value ?? '').toLowerCase()
}

function matchesSearch(record, search, fields) {
  if (!search) return true
  const keyword = search.toLowerCase()
  return fields.some((field) => toLower(record[field]).includes(keyword))
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

function average(values) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function getPuskesmasByDistrict(districtId) {
  return districtId ? puskesmas.filter((item) => item.districtId === districtId) : puskesmas
}

function getVillagesByPuskesmas(puskesmasId, districtId) {
  if (puskesmasId) return villages.filter((item) => item.puskesmasId === puskesmasId)
  if (districtId) return villages.filter((item) => item.districtId === districtId)
  return villages
}

function filterBase(records, filters, fields) {
  return records
    .filter((record) => matchesSearch(record, filters.search, fields))
    .filter((record) => (filters.year ? record.year === filters.year : true))
    .filter((record) => (filters.period ? record.period === filters.period : true))
    .filter((record) => (filters.districtId ? record.districtId === filters.districtId : true))
    .filter((record) => (filters.puskesmasId ? record.puskesmasId === filters.puskesmasId : true))
    .filter((record) => (filters.villageId ? record.villageId === filters.villageId : true))
}

export function getReportSharedOptions({ districtId = '', puskesmasId = '' } = {}) {
  return {
    years,
    periods,
    districts,
    puskesmas: getPuskesmasByDistrict(districtId),
    villages: getVillagesByPuskesmas(puskesmasId, districtId),
    progressStatuses,
    respondentTypes,
    validationStatuses,
    indicators: indicatorOptions,
    iksLevels,
    rankingStatuses,
  }
}

export async function fetchPHSKabupatenOptions(params) {
  return apiRequest('/admin/reports/phs-kabupaten/options?' + new URLSearchParams(params).toString());
}

export async function fetchPHSKabupatenRecords(params) {
  return apiRequest('/admin/reports/phs-kabupaten?' + new URLSearchParams(params).toString());
}

export async function fetchPHSKabupatenStats(params) {
  return apiRequest('/admin/reports/phs-kabupaten/stats?' + new URLSearchParams(params).toString());
}

export async function fetchIKSReportOptions(params) {
  return apiRequest('/admin/reports/iks/options?' + new URLSearchParams(params).toString());
}

export async function fetchIKSReportRecords(params) {
  return apiRequest('/admin/reports/iks?' + new URLSearchParams(params).toString());
}

export async function fetchIKSReportStats(params) {
  return apiRequest('/admin/reports/iks/stats?' + new URLSearchParams(params).toString());
}

export async function fetchRankingsOptions(params) {
  return apiRequest('/admin/reports/rankings/options?' + new URLSearchParams(params).toString());
}

export async function fetchRankingsRecords(params) {
  return apiRequest('/admin/reports/rankings?' + new URLSearchParams(params).toString());
}

export async function fetchRankingsStats(params) {
  return apiRequest('/admin/reports/rankings/stats?' + new URLSearchParams(params).toString());
}

export function getProgressStatusMeta(status) {
  const map = {
    'on-track': { label: 'On Track', tone: 'success' },
    'follow-up': { label: 'Perlu Follow Up', tone: 'warning' },
    critical: { label: 'Tertinggal', tone: 'danger' },
  }

  return map[status] || { label: status, tone: 'default' }
}

export function getValidationStatusMeta(status) {
  return status === 'validated'
    ? { label: 'Sudah tervalidasi', tone: 'success' }
    : { label: 'Menunggu validasi', tone: 'warning' }
}

export function getRankingStatusMeta(status) {
  const map = {
    excellent: { label: 'Sangat Baik', tone: 'success' },
    stable: { label: 'Stabil', tone: 'info' },
    alert: { label: 'Perlu Perhatian', tone: 'warning' },
    priority: { label: 'Prioritas Intervensi', tone: 'danger' },
    empty: { label: 'Belum Ada Data', tone: 'default' },
  }

  return map[status] || { label: status, tone: 'default' }
}

export function getIndicatorLabel(value) {
  return indicatorOptions.find((item) => item.value === value)?.label || value
}

export function getRespondentTypeLabel(value) {
  return respondentTypes.find((item) => item.value === value)?.label || value
}

export async function fetchSurveyProgressOptions(params) {
  return apiRequest('/admin/reports/survey-progress/options?' + new URLSearchParams(params).toString());
}

export async function fetchSurveyProgressRecords(params) {
  return apiRequest('/admin/reports/survey-progress?' + new URLSearchParams(params).toString());
}

export async function fetchSurveyProgressStats(params) {
  return apiRequest('/admin/reports/survey-progress/stats?' + new URLSearchParams(params).toString());
}

export async function fetchSurveyIndicatorOptions(params) {
  return apiRequest('/admin/reports/survey-indicators/options?' + new URLSearchParams(params).toString());
}

export async function fetchSurveyIndicatorRecords(params) {
  return apiRequest('/admin/reports/survey-indicators?' + new URLSearchParams(params).toString());
}

export async function fetchSurveyIndicatorStats(params) {
  return apiRequest('/admin/reports/survey-indicators/stats?' + new URLSearchParams(params).toString());
}
