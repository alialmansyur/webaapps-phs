import { Children } from 'react'

export function DataTable({
  headers,
  children,
  pagination,
  paginationMeta,
  onPageChange,
  emptyState,
  minWidth = 'min-w-[960px]',
  isLoading = false,
}) {
  const isPaginationObject = Boolean(pagination && typeof pagination === 'object')
  const meta = paginationMeta || (isPaginationObject ? pagination : null)
  const hasRows = Children.count(children) > 0

  return (
    <div className="app-panel-shell overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin"></div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className={`w-full text-left border-collapse ${minWidth}`}>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              {headers.map((header, i) => (
                <th key={i} className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {hasRows ? children : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  {emptyState || 'Belum ada data untuk ditampilkan.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {meta ? (
        <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm">
          <div className="text-slate-500 dark:text-slate-400">
            Menampilkan <span className="font-medium text-slate-800 dark:text-white">{meta.from}</span> - <span className="font-medium text-slate-800 dark:text-white">{meta.to}</span> dari <span className="font-medium text-slate-800 dark:text-white">{meta.total}</span> data
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => onPageChange && onPageChange(meta.page - 1)}
              className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            {(() => {
              const pages = []
              const total = meta.totalPages
              const current = meta.page
              
              if (total <= 1) return null
              
              pages.push(1)
              
              if (current > 3) pages.push('...')
              
              for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
                pages.push(i)
              }
              
              if (current < total - 2) pages.push('...')
              
              pages.push(total)
              
              return pages.map((pageNumber, index) => {
                if (pageNumber === '...') {
                  return <span key={`gap-${index}`} className="px-1 text-slate-400">...</span>
                }
                
                return (
                  <span key={pageNumber} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onPageChange && onPageChange(pageNumber)}
                      className={`px-3 py-1 rounded-md border transition-colors ${
                        pageNumber === current
                          ? 'bg-teal-500 border-teal-500 text-white font-medium shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  </span>
                )
              })
            })()}
            <button
              type="button"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange && onPageChange(meta.page + 1)}
              className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      ) : pagination ? (
        <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
          <div className="text-slate-500 dark:text-slate-400">
            Menampilkan <span className="font-medium text-slate-800 dark:text-white">1</span> - <span className="font-medium text-slate-800 dark:text-white">10</span> dari <span className="font-medium text-slate-800 dark:text-white">97</span> data
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">Prev</button>
            <button className="px-3 py-1 rounded-md bg-teal-500 text-white font-medium shadow-sm">1</button>
            <button className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">2</button>
            <button className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">3</button>
            <button className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">Next</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
