export function FilterBar({
  placeholder = 'Cari data...',
  onSearch,
  children,
  leftSlot,
  className = '',
}) {
  return (
    <div className={`app-panel-header bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative w-full sm:max-w-xs flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:text-white"
              placeholder={placeholder}
              onChange={(e) => onSearch && onSearch(e.target.value)}
            />
          </div>
          {leftSlot}
        </div>
        <div className="w-full lg:w-auto flex flex-wrap gap-2 justify-end">
          {children}
        </div>
      </div>
    </div>
  )
}
