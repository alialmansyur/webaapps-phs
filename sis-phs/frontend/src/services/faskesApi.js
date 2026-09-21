import { apiRequest } from './api'

export async function fetchMasterFaskesStats() {
  const result = await apiRequest('/admin/master/faskes/stats', { method: 'GET' })
  return result.data
}

export async function fetchDistricts(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  const result = await apiRequest(`/lookups/districts${query}`, { method: 'GET' })
  return result.data || []
}

export async function fetchMasterFaskesRecords(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page)
  if (params.perPage) query.append('perPage', params.perPage)
  if (params.search) query.append('search', params.search)
  if (params.districtId) query.append('districtId', params.districtId)
  if (params.status) query.append('status', params.status)
  if (params.type) query.append('type', params.type)
  if (params.cadreStatus) query.append('cadreStatus', params.cadreStatus)

  return await apiRequest(`/admin/master/faskes?${query.toString()}`, { method: 'GET' })
}

export async function createMasterFaskes(data) {
  return await apiRequest('/admin/master/faskes', {
    method: 'POST',
    body: data,
  })
}

export async function updateMasterFaskes(id, data) {
  return await apiRequest(`/admin/master/faskes/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteMasterFaskes(id) {
  return await apiRequest(`/admin/master/faskes/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchFaskesVillages(faskesId) {
  return await apiRequest(`/admin/master/faskes/${faskesId}/villages`, { method: 'GET' })
}

export async function addFaskesVillage(faskesId, villageId) {
  return await apiRequest(`/admin/master/faskes/${faskesId}/villages`, {
    method: 'POST',
    body: { village_id: villageId }
  })
}

export async function removeFaskesVillage(faskesId, villageId) {
  return await apiRequest(`/admin/master/faskes/${faskesId}/villages/${villageId}`, {
    method: 'DELETE'
  })
}

export async function searchVillages(query, districtId = null) {
  if (!query || query.length < 3) return { data: [] };
  const params = { search: query };
  if (districtId) params.district_id = districtId;
  const searchParams = new URLSearchParams(params);
  return await apiRequest(`/lookups/villages?${searchParams.toString()}`, { method: 'GET' });
}

export async function fetchFaskesKaders(faskesId) {
  return await apiRequest(`/admin/master/faskes/${faskesId}/kaders`, { method: 'GET' })
}
