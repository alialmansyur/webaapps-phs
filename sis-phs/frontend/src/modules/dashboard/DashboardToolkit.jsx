import ReactApexChart from 'react-apexcharts'

export function statusClass(tone) {
  const map = {
    success: 'text-teal-600 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-300',
    info: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300',
    warning: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300',
  }

  return map[tone] || map.info
}

export function DashboardHeader({ title, description, filters, value, onChange, children }) {
  return (
    <div className="app-panel-shell flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-900 dark:text-slate-300"
      >
        {filters.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

export function MetricCard({ label, value, subtitle, color = 'blue', targetValue, currentValue, targetLabel }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    purple: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  }

  const bgColors = {
    blue: 'bg-blue-500',
    teal: 'bg-teal-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-violet-500',
    emerald: 'bg-emerald-500',
  }

  const progressPct = (targetValue && currentValue !== undefined && targetValue > 0)
    ? Math.min(100, Math.max(0, (currentValue / targetValue) * 100))
    : 0;

  return (
    <div className="app-panel-shell p-5">
      <div className={`mb-4 inline-flex rounded-2xl px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] ${colors[color] || colors.blue}`}>
        {label}
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
      
      {targetValue !== undefined && (
        <div className="mt-4 mb-2">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {progressPct.toFixed(1)}% Tercapai
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {targetLabel || `Target: ${targetValue}%`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${bgColors[color] || bgColors.blue}`} 
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
      
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  )
}

export function SectionPanel({ title, subtitle, children, className = '' }) {
  return (
    <section className={`app-panel-shell p-6 ${className}`}>
      <div className="mb-5">
        <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function ProgressLine({ value }) {
  return (
    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-sky-500"
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  )
}

export function DashboardBarChart({ categories, series }) {
  const options = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    colors: ['#14b8a6', '#0ea5e9'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '42%' } },
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#64748b' } },
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    legend: { position: 'top', horizontalAlign: 'left' },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
  }

  return <ReactApexChart options={options} series={series} type="bar" height="100%" />
}

export function DashboardDonutChart({ labels, series }) {
  const options = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels,
    colors: ['#14b8a6', '#f59e0b', '#ef4444'],
    plotOptions: { pie: { donut: { size: '74%' } } },
    dataLabels: { enabled: false },
    legend: { position: 'bottom' },
    stroke: { width: 0 },
  }

  return <ReactApexChart options={options} series={series} type="donut" height="100%" />
}
