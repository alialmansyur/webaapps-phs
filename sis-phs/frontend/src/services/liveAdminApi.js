import { apiRequest, uploadWithProgress } from './api'

function withQuery(path, params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export async function fetchUserAdminOptions() {
  const [rolesResponse, districtsResponse, puskesmasResponse] = await Promise.all([
    apiRequest('/lookups/roles'),
    apiRequest('/lookups/districts'),
    apiRequest('/lookups/faskes?type=PUSKESMAS'),
  ])

  return {
    roles: (rolesResponse?.data || [])
      .filter((item) => ['admin', 'dinkes', 'puskesmas', 'auditor', 'analis'].includes(item.value)),
    statuses: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    districts: districtsResponse?.data || [],
    puskesmas: puskesmasResponse?.data || [],
  }
}

export async function fetchUserAdminRecords(params = {}) {
  return apiRequest(withQuery('/admin/users/admin', params))
}

export async function fetchUserAdminStats() {
  const response = await apiRequest(withQuery('/admin/users/admin', { per_page: 200 }))
  const records = response?.data || []

  return {
    total: response?.meta?.total || records.length,
    active: records.filter((record) => record.isActive).length,
    puskesmasAdmins: records.filter((record) => record.roleCode === 'puskesmas').length,
    districtLevel: records.filter((record) => record.scopeType === 'KABUPATEN').length,
  }
}

export async function createUserAdmin(payload) {
  return apiRequest('/admin/users/admin', {
    method: 'POST',
    body: payload,
  })
}

export async function updateUserAdmin(userId, payload) {
  return apiRequest(`/admin/users/admin/${userId}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function updateUserAdminStatus(userId, isActive) {
  return apiRequest(`/admin/users/admin/${userId}/status`, {
    method: 'PATCH',
    body: { is_active: isActive },
  })
}

export async function resetUserAdminPassword(userId) {
  return apiRequest(`/admin/users/admin/${userId}/reset-password`, {
    method: 'POST',
  })
}

export async function fetchUserKaderOptions() {
  return {
    statuses: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
  }
}

export async function searchFaskes(query) {
  if (!query || query.length < 3) return { data: [] };
  return apiRequest(withQuery('/lookups/faskes', { type: 'PUSKESMAS', search: query }));
}

export async function searchVillagesByFaskes(faskesId, query) {
  if (!faskesId || !query || query.length < 3) return { data: [] };
  return apiRequest(withQuery('/lookups/villages', { faskes_id: faskesId, search: query }));
}

export async function fetchUserKaderRecords(params = {}) {
  return apiRequest(withQuery('/admin/users/kader', params))
}

export async function fetchUserKaderStats() {
  const response = await apiRequest(withQuery('/admin/users/kader', { per_page: 200 }))
  const records = response?.data || []

  return {
    total: response?.meta?.total || records.length,
    active: records.filter((record) => record.isActive).length,
    inactive: records.filter((record) => !record.isActive).length,
    totalSurveys: records.reduce((total, record) => total + Number(record.surveyCount || 0), 0),
  }
}

export async function fetchRbacMatrix() {
  return apiRequest('/admin/rbac/matrix')
}

export async function fetchPeriodRecords(params = {}) {
  return apiRequest(withQuery('/admin/settings/periods', params))
}

export async function fetchRegionRecords(params = {}) {
  return apiRequest(withQuery('/admin/master/regions', params))
}

export async function fetchRegionDetail(level, regionId) {
  return apiRequest(`/admin/master/regions/${level}/${regionId}`)
}

export async function createRegion(payload) {
  return apiRequest('/admin/master/regions', {
    method: 'POST',
    body: payload,
  })
}

export async function updateRegion(level, regionId, payload) {
  return apiRequest(`/admin/master/regions/${level}/${regionId}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function importRegionsFile(file, { onProgress } = {}) {
  return uploadWithProgress('/admin/master/regions/import', file, { onProgress })
}

export async function deleteRegion(level, regionId) {
  return apiRequest(`/admin/master/regions/${level}/${regionId}`, {
    method: 'DELETE',
  })
}

export async function fetchPeriodDetail(periodId) {
  return apiRequest(`/admin/settings/periods/${periodId}`)
}

export async function createPeriod(payload) {
  return apiRequest('/admin/settings/periods', {
    method: 'POST',
    body: payload,
  })
}

export async function updatePeriod(periodId, payload) {
  return apiRequest(`/admin/settings/periods/${periodId}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function updatePeriodStatus(periodId, status) {
  return apiRequest(`/admin/settings/periods/${periodId}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function saveRbacMatrix(roleMenus) {
  return apiRequest('/admin/rbac/matrix', {
    method: 'PUT',
    body: { role_menus: roleMenus },
  })
}

export async function createRole(payload) {
  return apiRequest('/admin/rbac/roles', {
    method: 'POST',
    body: payload,
  })
}

export async function updateRole(roleCode, payload) {
  return apiRequest(`/admin/rbac/roles/${roleCode}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deleteRole(roleCode) {
  return apiRequest(`/admin/rbac/roles/${roleCode}`, {
    method: 'DELETE',
  })
}
