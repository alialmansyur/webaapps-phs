import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

const swal = { fire: () => Promise.resolve() };
const resolveAdminNotificationRoute = () => '/';

function fmtRelative(iso) {
  if (!iso) return '-'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.floor(diffMs / 60000))
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

export function Topbar({ title, onToggleSidebar }) {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [openNotif, setOpenNotif] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('tapg-theme') || 'light')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('tapg-theme', theme)
  }, [theme])

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) setOpenNotif(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    let alive = true

    const loadNotifications = async () => {
      try {
        const response = await apiRequest('/notifications?per_page=10')
        if (!alive) return
        const rows = response?.notifications?.data || []
        setNotifications(rows)
        setUnreadCount(Number(response?.unread_count || 0))
      } catch {
        if (!alive) return
      }
    }

    loadNotifications()
    const id = setInterval(() => {
      loadNotifications().catch(() => {})
    }, document.hidden ? 45000 : 15000)

    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  const markAllNotificationsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' })
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
      setUnreadCount(0)
    } catch {
      // no-op
    }
  }

  const openNotification = async (notif) => {
    await swal.fire({
      icon: 'info',
      title: notif?.title || 'Notifikasi',
      text: notif?.body || notif?.message || '-',
      confirmButtonText: 'Tutup',
    })
    if (!notif?.is_read) {
      try {
        await apiRequest(`/notifications/${notif.id}/read`, { method: 'PATCH' })
        setNotifications((prev) => prev.map((item) => (
          String(item.id) === String(notif.id)
            ? { ...item, is_read: true }
            : item
        )))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // no-op
      }
    }
    const route = resolveAdminNotificationRoute(notif?.data)
    setOpenNotif(false)
    navigate(route)
  }

  const formattedDate = now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header id="topbar" className="admin-topbar relative z-40 overflow-visible h-[72px] bg-white/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/50 flex items-center px-6 gap-4 flex-shrink-0 backdrop-blur-sm">
      <button onClick={onToggleSidebar} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-lg leading-none">☰</button>
      <div className="flex-1 min-w-0"><h1 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white truncate">{title}</h1></div>
      <div className="hidden lg:flex flex-col text-right leading-tight min-w-[220px]">
        <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">{formattedDate}</span>
        <span className="text-base text-slate-700 dark:text-slate-200 font-semibold tabular-nums">{formattedTime}</span>
      </div>
      <button
        onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center"
        title={theme === 'dark' ? 'Switch ke light mode' : 'Switch ke dark mode'}
      >
        {theme === 'dark' ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setOpenNotif((v) => !v)}
          className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center relative"
          title="Notifikasi"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
          </svg>
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
        </button>
        {openNotif && (
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-700 bg-slate-800 overflow-hidden z-[100] shadow-sm">
            <div className="px-4 py-3 border-b border-slate-700/70 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-white">Notifikasi</div>
                <div className="text-xs text-slate-400">{unreadCount} belum dibaca</div>
              </div>
              <button type="button" onClick={markAllNotificationsRead} className="text-[11px] text-blue-300 hover:text-blue-200">Baca semua</button>
            </div>
            <div className="max-h-72 overflow-y-auto custom-scroll">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-400">Belum ada notifikasi.</div>
              ) : notifications.map((notif) => (
                <button key={notif.id} type="button" onClick={() => openNotification(notif)} className="w-full text-left px-4 py-3 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${!notif.is_read ? 'bg-blue-400' : 'bg-slate-600'}`} />
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium">{notif.title}</div>
                      <div className="text-xs text-slate-300 mt-0.5">{notif.body || notif.message || '-'}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{fmtRelative(notif.created_at)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
