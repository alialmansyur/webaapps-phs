
export function getCurrentPlatform() {
  const hostname = window.location.hostname
  const port = window.location.port

  // Dev ports: Admin=5173, Web=5174
  // Prod ports: Admin=8002, Web=8001
  if (port === '5173' || port === '8002') return 'admin'
  if (port === '5174' || port === '8001') return 'web'

  // Fallback
  return 'admin'
}

export function getOtherPlatformUrl() {
  const hostname = window.location.hostname
  const port = window.location.port
  const protocol = window.location.protocol

  const currentPlatform = getCurrentPlatform()
  let targetPort = currentPlatform === 'admin' ? '5174' : '5173' // Dev default

  // If on production ports, navigate to production ports
  if (port === '8002' || port === '8001') {
    targetPort = currentPlatform === 'admin' ? '8001' : '8002'
  }

  return `${protocol}//${hostname}:${targetPort}`
}

export function navigateToPlatform(platform) {
  const hostname = window.location.hostname
  const port = window.location.port
  const protocol = window.location.protocol

  let targetPort = '5173' // Default to Admin dev port

  if (platform === 'web') {
    targetPort = port === '8002' || port === '8001' ? '8001' : '5174'
  } else if (platform === 'admin') {
    targetPort = port === '8002' || port === '8001' ? '8002' : '5173'
  }

  window.location.href = `${protocol}//${hostname}:${targetPort}`
}
