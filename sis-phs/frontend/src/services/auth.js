const AUTH_STORAGE_KEY = 'tapg-auth'
const AUTH_CHANGED_EVENT = 'tapg-auth-changed'

export function normalizeRole(input) {
  const role = String(input || '').trim().toLowerCase()
  return role || 'kader'
}

function emitAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

function normalizeMenuItem(raw) {
  if (!raw || typeof raw !== 'object') return null

  const children = Array.isArray(raw.children)
    ? raw.children.map(normalizeMenuItem).filter(Boolean)
    : []

  return {
    id: raw.id ?? raw.code ?? raw.path ?? '',
    code: raw.code ?? '',
    title: raw.title || '',
    path: raw.path || null,
    context_group: raw.context_group || null,
    children,
  }
}

function normalizeMenuTree(input) {
  if (!Array.isArray(input)) return []
  return input.map(normalizeMenuItem).filter(Boolean)
}

function collectMenuPaths(menuTree, target = []) {
  menuTree.forEach((item) => {
    if (item?.path) {
      target.push(item.path)
    }

    if (Array.isArray(item?.children) && item.children.length > 0) {
      collectMenuPaths(item.children, target)
    }
  })

  return target
}

export function mapMeResponse(raw) {
  const roles = Array.isArray(raw?.roles)
    ? raw.roles.map((role) => {
        if (typeof role === 'string') return role
        return role?.name || ''
      }).filter(Boolean)
    : []

  const permissions = Array.isArray(raw?.permissions)
    ? raw.permissions.map((permission) => {
        if (typeof permission === 'string') return permission
        return permission?.name || ''
      }).filter(Boolean)
    : []

  const menus = Array.isArray(raw?.menus)
    ? raw.menus.map((menu) => normalizeMenuItem(menu)).filter(Boolean)
    : []

  const menuTree = normalizeMenuTree(raw?.menu_tree)

  return {
    id: raw?.id ?? null,
    name: raw?.name || '',
    username: raw?.username || '',
    email: raw?.email || '',
    phone: raw?.phone || '',
    avatar: raw?.avatar || null,
    avatar_url: raw?.avatar_url || null,
    duty_location: raw?.duty_location || null,
    is_active: Boolean(raw?.is_active),
    must_reset_password: Boolean(raw?.must_reset_password),
    roles,
    permissions,
    role: raw?.role || null,
    menus,
    menu_tree: menuTree,
    scope: raw?.scope || null,
  }
}

export function getAuthSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw)
    if (!session?.token) return null
    return session
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function getCurrentRole() {
  const sessionRole = getAuthSession()?.user?.roles?.[0]
  const localRole = localStorage.getItem('role')
  return normalizeRole(sessionRole || localRole)
}

export function saveAuthSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  const role = session?.user?.roles?.[0]
  if (role) {
    localStorage.setItem('role', normalizeRole(role))
  }
  emitAuthChanged()
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem('role')
  emitAuthChanged()
}

export function getBearerToken() {
  const session = getAuthSession()
  return session?.token ?? null
}

export function isAuthenticated() {
  return Boolean(getBearerToken())
}

export function subscribeAuthChange(listener) {
  window.addEventListener(AUTH_CHANGED_EVENT, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function getCurrentUserMenuTree(session = getAuthSession()) {
  return normalizeMenuTree(session?.user?.menu_tree)
}

export function getCurrentUserMenuPaths(session = getAuthSession()) {
  return Array.from(new Set(collectMenuPaths(getCurrentUserMenuTree(session), [])))
}

export function hasMenuAccess(path, session = getAuthSession()) {
  if (!path) return false
  return getCurrentUserMenuPaths(session).includes(path)
}

export async function refreshAuthSession() {
  const session = getAuthSession()
  const token = session?.token
  if (!token) return null

  const rawBase = import.meta.env.VITE_API_BASE_URL
  const apiBaseUrl = rawBase && rawBase.trim() ? rawBase.trim() : 'http://localhost:9002/api'
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession()
    }
    return null
  }

  const body = await response.json()
  const mappedUser = mapMeResponse(body)

  const nextSession = {
    token,
    user: {
      ...body,
      ...mappedUser,
    },
  }

  saveAuthSession(nextSession)
  return nextSession
}
