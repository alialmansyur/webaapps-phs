import { getAuthSession, getCurrentUserMenuTree, hasMenuAccess, normalizeRole } from '../../services/auth'

const roleMeta = {
  kader: {
    label: 'Kader',
    homePath: '/kader/dashboard',
  },
  puskesmas: {
    label: 'Puskesmas',
    homePath: '/puskesmas/dashboard',
  },
  dinkes: {
    label: 'Dinkes',
    homePath: '/dinkes/dashboard',
  },
  admin: {
    label: 'Admin',
    homePath: '/admin/dashboard',
  },
  auditor: {
    label: 'Auditor',
    homePath: '/admin/settings/audit',
  },
  analis: {
    label: 'Analis',
    homePath: '/admin/reports/survey-progress',
  },
}

export function getRoleMeta(roleRaw) {
  const role = normalizeRole(roleRaw)
  return roleMeta[role] || {
    label: role.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    homePath: '/login',
  }
}

export function getRoleHomePath(roleRaw, session = getAuthSession()) {
  const menuTree = getCurrentUserMenuTree(session)
  const firstPath = menuTree
    .flatMap((item) => (Array.isArray(item.children) && item.children.length > 0 ? item.children : [item]))
    .find((item) => item?.path)?.path

  return firstPath || getRoleMeta(roleRaw).homePath
}

export function getRoleLabel(roleRaw) {
  return getRoleMeta(roleRaw).label
}

export function getRoleMenu(_roleRaw, session = getAuthSession()) {
  const menuTree = getCurrentUserMenuTree(session)
  return menuTree.length > 0 ? menuTree : []
}

export function canAccessRoute(path, session = getAuthSession()) {
  if (path === '/kader/profile/account') return true
  if (path.startsWith('/kader/surveys/summary/')) {
    return hasMenuAccess('/kader/surveys/history', session) || hasMenuAccess('/kader/surveys/new', session)
  }
  return hasMenuAccess(path, session)
}

export const ROLE_OPTIONS = Object.entries(roleMeta).map(([value, meta]) => ({
  value,
  label: meta.label,
  homePath: meta.homePath,
}))
