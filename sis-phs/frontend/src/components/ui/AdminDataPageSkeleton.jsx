function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-700/70 ${className}`} />
}

export function AdminDataPageSkeleton({
  title,
  description,
  icon,
  tableColumnCount = 7,
  tableRowCount = 5,
  statCount = 4,
  filterFieldCount = 4,
  actionCount = 3,
  chartCount = 0,
}) {
  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            {icon}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: actionCount }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 w-36" />
          ))}
        </div>
      </div>

      {statCount > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: statCount }).map((_, index) => (
            <div key={index} className="app-panel-shell p-6">
              <div className="flex items-center gap-4">
                <SkeletonBlock className="h-12 w-12 rounded-[1rem]" />
                <div className="flex-1 space-y-3">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-8 w-20" />
                </div>
              </div>
              <SkeletonBlock className="mt-4 h-4 w-40" />
            </div>
          ))}
        </div>
      ) : null}

      {chartCount > 0 ? (
        <div className={`grid grid-cols-1 gap-6 ${chartCount > 1 ? 'xl:grid-cols-3' : ''}`}>
          {Array.from({ length: chartCount }).map((_, index) => (
            <div
              key={index}
              className={`app-panel-shell p-6 ${chartCount > 1 && index === 0 ? 'xl:col-span-2' : ''}`}
            >
              <div className="space-y-3">
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="h-6 w-56" />
                <SkeletonBlock className="h-4 w-72 max-w-full" />
              </div>
              <SkeletonBlock className="mt-6 h-[280px] w-full rounded-[1.25rem]" />
            </div>
          ))}
        </div>
      ) : null}

      {tableColumnCount > 0 ? (
        <div className="master-card-shell flex flex-col overflow-hidden">
        <div className="app-panel-header bg-white p-4 dark:bg-slate-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <SkeletonBlock className="h-11 w-full sm:max-w-xs" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <SkeletonBlock className="h-11 w-36" />
              <SkeletonBlock className="h-11 w-32" />
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="bg-slate-50/80 px-4 py-4 dark:bg-slate-900/40 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-4 w-96 max-w-full" />
              </div>
              <div className="flex flex-wrap gap-2">
                <SkeletonBlock className="h-10 w-36" />
                <SkeletonBlock className="h-10 w-24" />
              </div>
            </div>
          </div>

          <div className="app-panel-body grid grid-cols-1 gap-4 bg-white px-4 py-5 dark:bg-slate-800 md:grid-cols-2 xl:grid-cols-4 sm:px-6">
            {Array.from({ length: filterFieldCount }).map((_, index) => (
              <div key={index} className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="app-panel-shell overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[960px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                    {Array.from({ length: tableColumnCount }).map((_, index) => (
                      <th key={index} className="px-6 py-4">
                        <SkeletonBlock className="h-3 w-20 rounded-xl" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {Array.from({ length: tableRowCount }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: tableColumnCount }).map((_, colIndex) => (
                        <td key={colIndex} className="px-6 py-4">
                          <SkeletonBlock className={`${colIndex === tableColumnCount - 1 ? 'h-10 w-28' : 'h-4 w-full max-w-[11rem]'}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm dark:border-slate-700 dark:bg-slate-900/30 md:flex-row md:items-center md:justify-between">
              <SkeletonBlock className="h-4 w-56" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-8 w-14 rounded-xl" />
                <SkeletonBlock className="h-8 w-10 rounded-xl" />
                <SkeletonBlock className="h-8 w-10 rounded-xl" />
                <SkeletonBlock className="h-8 w-14 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        </div>
      ) : null}
    </div>
  )
}
