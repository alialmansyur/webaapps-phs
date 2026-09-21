import { apiRequest } from './api'

function withQuery(path, params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export async function fetchKaderOperationalOptions({ districtId = '' } = {}) {
  const [districtsResponse, villagesResponse] = await Promise.all([
    apiRequest('/lookups/districts'),
    apiRequest(withQuery('/lookups/villages', { district_id: districtId || undefined })),
  ])

  return {
    districts: districtsResponse?.data || [],
    villages: villagesResponse?.data || [],
    validationStatuses: [
      { value: 'SUBMITTED', label: 'Menunggu Validasi' },
      { value: 'APPROVED', label: 'Disetujui' },
      { value: 'REVISION', label: 'Perlu Revisi' },
      { value: 'REJECTED', label: 'Ditolak' },
    ],
    interventionStatuses: [
      { value: 'PENDING', label: 'Menunggu' },
      { value: 'SCHEDULED', label: 'Terjadwal' },
      { value: 'ONGOING', label: 'Berjalan' },
      { value: 'DONE', label: 'Selesai' },
      { value: 'OVERDUE', label: 'Terlambat' },
    ],
  }
}
