import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { clearAuthSession, getAuthSession, getCurrentRole, mapMeResponse, subscribeAuthChange } from '../services/auth'
import { apiRequest } from '../services/api'
import { getRoleMenu } from '../modules/navigation/config'

function toRoleLabel(input) {
  const raw = String(input || '').trim()
  if (!raw) return 'User'
  return raw
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function initialsOf(name) {
  const raw = String(name || '').trim()
  if (!raw) return 'U'
  const words = raw.split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] || ''
  const second = words.length > 1 ? words[1]?.[0] || '' : words[0]?.[1] || ''
  return `${first}${second}`.toUpperCase() || 'U'
}

// Komponen Helper untuk render Icon Dinamis
const DynamicIcon = ({ name, className }) => {
  const IconComponent = LucideIcons[name] || LucideIcons['Circle']
  return <IconComponent className={className} />
}

const MENU_ICON_MAP = {
  'group-dashboard': 'PanelsTopLeft',
  'group-surveys': 'ClipboardList',
  'group-interventions': 'HeartPulse',
  'group-reports': 'Files',
  'group-master-data': 'Database',
  'group-users': 'Users',
  'group-profile': 'BadgeCheck',
  'group-settings': 'Settings2',
}

function decorateMenuItems(menuItems = []) {
  return menuItems.map((item) => ({
    ...item,
    icon: item.icon || MENU_ICON_MAP[item.code] || MENU_ICON_MAP[item.id] || 'Circle',
    children: Array.isArray(item.children) ? item.children : [],
  }))
}

export function Sidebar({ collapsed, isMobile = false, mobileOpen = false, onCloseMobile = null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeGroupId, setActiveGroupId] = useState(null)
  const sidebarShellClass = 'bg-gradient-to-b from-[#0a3468] via-[#082c58] to-[#062447] border-r border-[#11457f]'
  const menuButtonBaseClass = collapsed
    ? 'w-12 h-12 aspect-square mx-auto flex items-center justify-center rounded-2xl'
    : 'flex items-center gap-3 px-4 py-3 rounded-2xl'
  const menuItemIdleClass = 'text-white/88 hover:bg-white/8 hover:text-white'
  const menuItemActiveClass = 'bg-teal-500 text-white'
  const subItemIdleClass = 'text-white/75 hover:text-white hover:bg-white/8'
  const subItemActiveClass = 'bg-white/10 text-white'
  
  useEffect(() => {
    setActiveGroupId(null)
  }, [location.pathname])
  
  const buildCurrentUser = () => {
    const session = getAuthSession()
    const user = mapMeResponse(session?.user || {})
    const roleRaw = user?.roles?.[0] || getCurrentRole()
    return {
      name: user?.name || 'User',
      roleRaw,
      role: toRoleLabel(roleRaw),
      avatar: initialsOf(user?.name),
    }
  }

  const [currentUser, setCurrentUser] = useState(buildCurrentUser)

  const [menuItems, setMenuItems] = useState(() => decorateMenuItems(getRoleMenu(currentUser.roleRaw)))

  useEffect(() => {
    const syncSidebar = () => {
      const nextUser = buildCurrentUser()
      setCurrentUser(nextUser)
      setMenuItems(decorateMenuItems(getRoleMenu(nextUser.roleRaw)))
    }

    syncSidebar()
    const unsubscribe = subscribeAuthChange(syncSidebar)
    return unsubscribe
  }, [])

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch {
      // Ignore API logout error and force local logout.
    } finally {
      clearAuthSession()
      navigate('/login', { replace: true })
    }
  }

  return (
    <aside
      id="sidebar"
      className={`admin-sidebar ${sidebarShellClass} flex flex-col flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'} ${isMobile ? `fixed inset-y-0 left-0 z-50 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}` : 'relative translate-x-0'}`}
    >
      <div className={`h-[72px] border-b border-white/10 flex items-center ${collapsed ? 'justify-center px-2' : 'px-6'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-4'}`}>
          <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center text-sm font-extrabold flex-shrink-0">
            PHS
          </div>
          {!collapsed && <div><div className="font-extrabold text-lg tracking-wide text-white">SIS-PHS</div><div className="mt-0.5 text-xs font-semibold text-white/70">Program Indonesia Sehat</div></div>}
        </div>
      </div>

      <nav className={`flex-1 overflow-y-auto custom-scroll ${collapsed ? 'px-3 py-4 space-y-2' : 'p-4 space-y-1'}`}>
        {!collapsed && <div className="mt-2 mb-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white/45">Menu Utama</div>}
        {menuItems.map((item, idx) => {
          const id = item.title || idx
          const hasChildren = Array.isArray(item.children) && item.children.length > 0
          const childActive = hasChildren && item.children.some((child) => location.pathname.startsWith(child.path))
          const groupOpen = activeGroupId !== null ? activeGroupId === id : childActive

          if (!hasChildren) {
            return (
              <NavLink
                key={id}
                to={item.path}
                onClick={() => {
                  if (isMobile && typeof onCloseMobile === 'function') onCloseMobile()
                }}
                className={({ isActive }) => `text-base font-semibold transition-all duration-200 ${menuButtonBaseClass} ${isActive ? menuItemActiveClass : menuItemIdleClass}`}
              >
                {() => (
                  <>
                    <DynamicIcon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-left flex-1">{item.title}</span>}
                  </>
                )}
              </NavLink>
            )
          }

          return (
            <div key={id} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  if (collapsed) {
                    navigate(item.children[0].path)
                    return
                  }
                  setActiveGroupId(groupOpen ? '' : id)
                }}
                className={`w-full text-base font-semibold transition-all duration-200 ${menuButtonBaseClass} ${childActive ? menuItemActiveClass : menuItemIdleClass}`}
              >
                <DynamicIcon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-left flex-1">{item.title}</span>}
                {!collapsed && <LucideIcons.ChevronDown className={`w-4 h-4 transition-transform duration-200 ${groupOpen ? 'rotate-180' : ''}`} />}
              </button>

              {!collapsed && groupOpen && (
                <div className="pl-4 pr-2 space-y-1 mt-1">
                  {item.children.map((child, cIdx) => (
                    <NavLink
                      key={child.title || cIdx}
                      to={child.path}
                      onClick={() => {
                        if (isMobile && typeof onCloseMobile === 'function') onCloseMobile()
                      }}
                      className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive ? subItemActiveClass : subItemIdleClass}`}
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-teal-200' : 'bg-white/35'}`} />
                          <span>{child.title}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className={`border-t border-white/10 ${collapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center rounded-xl transition-all hover:bg-white/8 ${collapsed ? 'w-12 h-12 aspect-square justify-center mx-auto' : 'gap-3 p-2'}`}>
          <div className="w-10 h-10 rounded-xl bg-white/12 flex items-center justify-center text-sm font-extrabold flex-shrink-0 text-white ring-1 ring-white/10">{currentUser.avatar}</div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="truncate text-base font-semibold text-white">{currentUser.name}</div>
                <div className="text-sm font-medium text-white/65">{currentUser.role}</div>
              </div>
              <button type="button" onClick={handleLogout} className="p-1 text-white/65 transition-colors hover:text-white" title="Logout">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={handleLogout}
            className="w-10 h-10 aspect-square mx-auto mt-2 flex items-center justify-center rounded-xl text-white/65 hover:text-white hover:bg-white/8 transition-colors"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  )
}
