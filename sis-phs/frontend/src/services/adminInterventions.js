import { apiRequest } from './api'

export async function getAdminInterventions(params = {}) {
  const query = new URLSearchParams()
  
  if (params.page) query.append('page', params.page)
  if (params.perPage) query.append('perPage', params.perPage)
  if (params.search) query.append('search', params.search)
  if (params.districtId) query.append('districtId', params.districtId)
  if (params.villageId) query.append('villageId', params.villageId)
  if (params.puskesmasId) query.append('puskesmasId', params.puskesmasId)
  if (params.kaderId) query.append('kaderId', params.kaderId)

  return apiRequest(`/admin/surveys/interventions?${query.toString()}`)
}

export async function createAdminIntervention(payload) {
  return apiRequest('/admin/surveys/interventions', {
    method: 'POST',
    body: payload,
  })
}

export async function updateAdminIntervention(id, payload) {
  return apiRequest(`/admin/surveys/interventions/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deleteAdminIntervention(id) {
  return apiRequest(`/admin/surveys/interventions/${id}`, {
    method: 'DELETE',
  })
}
