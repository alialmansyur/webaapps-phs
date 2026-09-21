import { apiRequest } from '../api'

export async function fetchInterventions(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page)
  if (params.perPage) query.append('perPage', params.perPage)
  if (params.search) query.append('search', params.search)
  if (params.tab) query.append('tab', params.tab)
  
  return apiRequest(`/kader/interventions?${query.toString()}`)
}

export async function storeIntervention(data) {
  return apiRequest('/kader/interventions', {
    method: 'POST',
    body: data,
  })
}

export async function fetchInterventionLog(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page)
  if (params.perPage) query.append('perPage', params.perPage)
  if (params.search) query.append('search', params.search)
  if (params.districtId) query.append('districtId', params.districtId)
  if (params.villageId) query.append('villageId', params.villageId)
  if (params.status) query.append('status', params.status)

  return apiRequest(`/kader/interventions/log?${query.toString()}`)
}
