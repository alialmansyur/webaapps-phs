import { clearAuthSession, getBearerToken, getCurrentRole } from './auth'

const rawBase = import.meta.env.VITE_API_BASE_URL
export const API_BASE_URL = rawBase && rawBase.trim() ? rawBase.trim() : 'http://localhost:9002/api'

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function buildHeaders(customHeaders = {}) {
  const headers = { Accept: 'application/json', ...customHeaders }
  const token = getBearerToken()

  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  }

  return headers
}

function extractErrorMessage(body, fallbackMessage) {
  if (!body) return fallbackMessage
  if (typeof body === 'string') return body
  if (typeof body.message === 'string' && body.message) return body.message

  if (body.errors && typeof body.errors === 'object') {
    const firstKey = Object.keys(body.errors)[0]
    const firstError = firstKey ? body.errors[firstKey] : null
    if (Array.isArray(firstError) && firstError.length > 0) return firstError[0]
    if (typeof firstError === 'string') return firstError
  }

  return fallbackMessage
}

const MOCK_NOTIFICATIONS = {
  kader: [
    { id: 'k-1', title: 'Target harian mendekati batas', body: 'Masih ada 2 survei yang perlu diselesaikan hari ini.', created_at: '2026-06-09T08:15:00+07:00', is_read: false },
    { id: 'k-2', title: 'Intervensi keluarga prioritas', body: 'Keluarga Agus Salim perlu tindak lanjut ulang minggu ini.', created_at: '2026-06-08T14:10:00+07:00', is_read: true },
  ],
  puskesmas: [
    { id: 'p-1', title: 'Verifikasi baru masuk', body: '27 survei menunggu approval petugas Puskesmas.', created_at: '2026-06-09T09:00:00+07:00', is_read: false },
  ],
  dinkes: [
    { id: 'd-1', title: 'Laporan agregat siap', body: 'Rekap kabupaten periode Semester I dapat ditinjau.', created_at: '2026-06-09T07:30:00+07:00', is_read: false },
  ],
  admin: [
    { id: 'a-1', title: 'Review RBAC MVP', body: 'Struktur role dan menu siap untuk sinkronisasi backend.', created_at: '2026-06-09T10:00:00+07:00', is_read: false },
    { id: 'a-2', title: 'Audit trail placeholder', body: 'Panel audit sementara memakai data mock untuk demonstrasi.', created_at: '2026-06-08T16:45:00+07:00', is_read: true },
  ],
}

export async function apiRequest(path, options = {}) {
  const method = options.method || 'GET'

  if (path.includes('/notifications/read-all')) {
    return { success: true }
  }

  if (path.includes('/notifications/') && path.includes('/read')) {
    return { success: true }
  }

  if (path.includes('/notifications')) {
    const role = getCurrentRole()
    const notifications = MOCK_NOTIFICATIONS[role] || []
    return {
      notifications: { data: notifications },
      unread_count: notifications.filter((item) => !item.is_read).length,
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...buildHeaders(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (response.ok) {
    return body
  }

  if (response.status === 401) {
    clearAuthSession()
    if (window.location.pathname !== '/login') {
      window.location.replace('/login')
    }
  }

  throw new ApiError(
    extractErrorMessage(body, `Request gagal (${response.status})`),
    { status: response.status, details: body },
  )
}

export function uploadWithProgress(path, file, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}${path}`)

    const token = getBearerToken()
    xhr.setRequestHeader('Accept', 'application/json')
    if (token) {
      xhr.setRequestHeader('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`)
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== 'function') return
      onProgress(Math.round((event.loaded / event.total) * 100))
    }

    xhr.onload = () => {
      const raw = xhr.responseText || ''
      let body = raw
      try { body = raw ? JSON.parse(raw) : null } catch { body = raw }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body)
        return
      }

      if (xhr.status === 401) {
        clearAuthSession()
        if (window.location.pathname !== '/login') {
          window.location.replace('/login')
        }
      }

      reject(new ApiError(
        extractErrorMessage(body, `Request gagal (${xhr.status})`),
        { status: xhr.status, details: body },
      ))
    }

    xhr.onerror = () => reject(new ApiError('Jaringan bermasalah saat upload file.'))

    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}

export function getDashboardData(role, filter) {
  return apiRequest(`/${role}/dashboard?filter=${filter}`)
}
