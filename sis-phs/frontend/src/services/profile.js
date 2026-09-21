import { apiRequest } from './api'

export async function fetchKaderProfile() {
  return apiRequest('/kader/profile')
}

export async function updateKaderProfile(data) {
  return apiRequest('/kader/profile', {
    method: 'PUT',
    body: data,
  })
}

export async function updateKaderPassword(data) {
  return apiRequest('/kader/profile/password', {
    method: 'PUT',
    body: data,
  })
}

export async function fetchWilayahBinaan(params) {
  const query = new URLSearchParams(params).toString()
  return apiRequest(`/kader/profile/wilayah?${query}`)
}

export async function createWilayahBinaan(data) {
  return apiRequest('/kader/profile/wilayah', {
    method: 'POST',
    body: data,
  })
}

export async function updateWilayahBinaan(id, data) {
  return apiRequest(`/kader/profile/wilayah/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteWilayahBinaan(id) {
  return apiRequest(`/kader/profile/wilayah/${id}`, {
    method: 'DELETE',
  })
}
