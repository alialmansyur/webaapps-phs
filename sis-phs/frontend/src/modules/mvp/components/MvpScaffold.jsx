import { ArrowRight, CalendarClock, DatabaseZap, Download, PlugZap } from 'lucide-react'

function panelClassName(className = '') {
  return `rounded-[28px] border border-slate-200/70 bg-white/95 p-6 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none ${className}`.trim()
}

export function PageIntro({ eyebrow, title, description, actions = [] }) {
  return (
    <section className={panelClassName('overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800')}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
            <CalendarClock className="h-4 w-4" />
            {eyebrow}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
          </div>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={action.variant === 'secondary'
                  ? 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  : 'inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700'}
              >
                {action.icon === 'download' ? <Download className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function StatStrip({ items }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className={panelClassName()}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{item.label}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone || 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'}`}>
              {item.badge}
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{item.value}</div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{item.caption}</p>
        </article>
      ))}
    </section>
  )
}

export function TwoColumn({ left, right }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">{left}</div>
      <div className="space-y-6">{right}</div>
    </section>
  )
}

export function TaskBoard({ title, subtitle, items }) {
  return (
    <section className={panelClassName()}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{items.length} item</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white">{item.title}</h4>
                  <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{item.meta}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function SimpleTable({ title, subtitle, columns, rows }) {
  return (
    <section className={panelClassName('overflow-hidden p-0')}>
      <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-slate-50 text-left dark:bg-slate-950/50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${row[columns[0].key]}`} className="border-t border-slate-100 dark:border-slate-800">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function ChecklistPanel({ title, subtitle, items }) {
  return (
    <section className={panelClassName()}>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/40">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500" />
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-100">{item.label}</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function IntegrationPanel({ title, points }) {
  return (
    <section className={panelClassName('bg-slate-950 text-white dark:bg-slate-950')}>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white/10 p-3">
          <PlugZap className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-slate-300">Wadah integrasi backend sudah disiapkan di level route, menu, dan placeholder state.</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {points.map((point) => (
          <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <DatabaseZap className="mt-0.5 h-4 w-4 text-teal-300" />
            <p className="text-sm text-slate-200">{point}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function StatusBadge({ children, tone = 'neutral' }) {
  const toneMap = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    info: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
  }

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneMap[tone] || toneMap.neutral}`}>{children}</span>
}
