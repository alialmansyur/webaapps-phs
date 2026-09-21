import { Children } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

export function FilterPanel({
  title = 'Filter Data',
  description,
  isOpen,
  onToggle,
  onReset,
  onApply,
  children,
  summary,
  columns,
}) {
  const childCount = Children.count(children)
  const activeColumns = columns || childCount || 4

  const layoutMap = {
    3: {
      gridClassName: 'grid grid-cols-1 gap-4 bg-white px-4 py-5 dark:bg-slate-800 md:grid-cols-2 xl:grid-cols-12 sm:px-6',
      itemClassName: 'xl:col-span-4',
    },
    4: {
      gridClassName: 'grid grid-cols-1 gap-4 bg-white px-4 py-5 dark:bg-slate-800 md:grid-cols-2 xl:grid-cols-4 sm:px-6',
      itemClassName: '',
    },
    5: {
      gridClassName: 'grid grid-cols-1 gap-4 bg-white px-4 py-5 dark:bg-slate-800 md:grid-cols-2 xl:grid-cols-10 sm:px-6',
      itemClassName: 'xl:col-span-2',
    },
    6: {
      gridClassName: 'grid grid-cols-1 gap-4 bg-white px-4 py-5 dark:bg-slate-800 md:grid-cols-2 xl:grid-cols-12 sm:px-6',
      itemClassName: 'xl:col-span-2',
    },
  }

  const layout = layoutMap[activeColumns] || layoutMap[4]

  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <div className="px-4 sm:px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-slate-50/80 dark:bg-slate-900/40">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h3>
          </div>
          {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          {summary ? <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{summary}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            {isOpen ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <X size={14} />
            Reset
          </button>
          {onApply && (
            <button
              type="button"
              onClick={onApply}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Terapkan Filter
            </button>
          )}
        </div>
      </div>

      {isOpen ? (
        <div className={layout.gridClassName}>
          {Children.map(children, (child, index) => (
            <div key={index} className={layout.itemClassName}>
              {child}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
