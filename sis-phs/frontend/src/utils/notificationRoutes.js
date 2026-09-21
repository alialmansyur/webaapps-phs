const ADMIN_DEFAULT_ROUTE = '/work-orders'

function normalizeRouteValue(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function buildRouteWithParams(route, params) {
  const normalizedRoute = normalizeRouteValue(route)
  if (!normalizedRoute) return ''

  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return normalizedRoute
  }

  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    search.set(key, String(value))
  })

  const query = search.toString()
  if (!query) return normalizedRoute
  return normalizedRoute.includes('?') ? `${normalizedRoute}&${query}` : `${normalizedRoute}?${query}`
}

export function resolveAdminNotificationRoute(data) {
  const structuredTarget = data?.target?.admin
  const structuredRoute = buildRouteWithParams(structuredTarget?.route, structuredTarget?.params)
  if (structuredRoute) return structuredRoute

  const adminRoute = normalizeRouteValue(data?.admin_route)
  if (adminRoute) return adminRoute

  const genericRoute = normalizeRouteValue(data?.route)
  if (!genericRoute) return ADMIN_DEFAULT_ROUTE

  if (genericRoute.includes('breakdown')) return '/breakdown-reports'
  if (genericRoute.includes('finding')) return '/findings'
  if (genericRoute.includes('workshop') || genericRoute.includes('work-order') || genericRoute.includes('mechanic')) return '/work-orders'
  if (genericRoute.includes('p2h')) return '/p2h'
  if (genericRoute.includes('schedule')) return '/schedule'
  if (genericRoute.includes('notification')) return '/settings/notification-test'

  return ADMIN_DEFAULT_ROUTE
}
