import { ArrowRight, ChevronRight, Clock3, Download, Sparkles } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'

export function DashboardHero({ eyebrow, title, description, actions = [], accent = 'from-teal-500/12 via-white to-cyan-500/10', aside }) {
  return (
    <section className={`app-panel-shell overflow-hidden bg-gradient-to-br ${accent} p-6 lg:p-7`}>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:border-teal-500/30 dark:bg-slate-900/60 dark:text-teal-300">
            <Sparkles className="h-4 w-4" />
            {eyebrow}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={action.variant === 'secondary'
                    ? 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                    : 'inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700'}
                >
                  {action.icon === 'download' ? <Download className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
    </section>
  )
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-2 dark:bg-slate-900">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={value === option.value
            ? 'rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition dark:bg-slate-800 dark:text-white dark:ring-slate-700'
            : 'rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-white/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function MetricGrid({ items, icons }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          trend={item.trend}
          color={item.color}
          icon={icons?.[index]}
        />
      ))}
    </div>
  )
}

export function DataPanel({ title, subtitle, right, children, className = '' }) {
  return (
    <section className={`app-panel-shell ${className}`}>
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 dark:border-slate-700">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      </div>
      {children}
    </section>
  )
}

export function SpotlightList({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/60 bg-white/75 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">{item.label}</div>
          <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{item.value}</div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.detail}</p>
        </div>
      ))}
    </div>
  )
}

export function FunnelList({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{item.hint}</div>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{item.value.toLocaleString('id-ID')}</div>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${(item.value / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ActionTiles({ items }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-500/40 dark:hover:bg-slate-800"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-slate-900 dark:text-white">{item.label}</div>
            <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:text-teal-600 dark:group-hover:text-teal-300" />
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
        </button>
      ))}
    </div>
  )
}

export function ActivityFeed({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                <StatusPill tone={item.tone}>{item.status}</StatusPill>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              {item.meta}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatusPill({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    info: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
  }

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.neutral}`}>{children}</span>
}

export function DataTable({ columns, rows }) {
  return (
    <div className="-mx-6 overflow-x-auto px-6">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-left dark:border-slate-700">
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500 first:pl-0 last:pr-0">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row[columns[0].key]}`} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-4 text-sm text-slate-600 first:pl-0 last:pr-0 dark:text-slate-300">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
