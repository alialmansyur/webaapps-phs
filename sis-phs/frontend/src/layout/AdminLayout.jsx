import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AdminLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)')
    const onChange = (event) => {
      setIsMobile(event.matches)
      if (!event.matches) {
        setMobileSidebarOpen(false)
      }
    }

    setIsMobile(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen((value) => !value)
      return
    }
    setCollapsed((value) => !value)
  }

  return (
    <div className="admin-ui-root flex h-[100dvh] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white overflow-hidden relative">
      <Sidebar
        collapsed={isMobile ? false : collapsed}
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      {isMobile && mobileSidebarOpen ? <div className="fixed inset-0 z-40 bg-slate-950/60" onClick={() => setMobileSidebarOpen(false)} /> : null}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 custom-scroll p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
