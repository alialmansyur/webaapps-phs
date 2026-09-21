import ReactApexChart from 'react-apexcharts'

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
export function DateField({ label, value, onChange }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="date"
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
      />
    </label>
  )
}

export function InfoBlock({ label, value, tone = 'default' }) {
  const tones = {
    default: 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
    success: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-500/10',
    warning: 'border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-500/10',
    danger: 'border-rose-200 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-500/10',
    info: 'border-sky-200 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-500/10',
  }

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.default}`}>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800 dark:text-white">{value}</div>
    </div>
  )
}

export function ToneBadge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  }

  return (
    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${tones[tone] || tones.default}`}>
      {children}
    </span>
  )
}

export function ChartCard({
  eyebrow,
  title,
  description,
  footer,
  children,
  className = '',
}) {
  return (
    <section className={`app-panel-shell p-6 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? <div className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">{eyebrow}</div> : null}
          <h3 className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
          {description ? <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
        {footer ? <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{footer}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function ApexChart({
  type,
  series,
  options,
  height = 320,
}) {
  return <ReactApexChart type={type} series={series} options={options} height={height} />
}

export function InsightTextCard({
  title,
  description,
  accent = 'teal',
  items = [],
}) {
  const accents = {
    teal: 'from-teal-500/15 via-cyan-500/10 to-white dark:to-slate-800',
    amber: 'from-amber-500/15 via-orange-500/10 to-white dark:to-slate-800',
    rose: 'from-rose-500/15 via-pink-500/10 to-white dark:to-slate-800',
    emerald: 'from-emerald-500/15 via-lime-500/10 to-white dark:to-slate-800',
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br p-5 dark:border-slate-700 ${accents[accent] || accents.teal}`}>
      <h4 className="text-base font-bold text-slate-800 dark:text-white">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-4 rounded-xl bg-white/70 px-4 py-3 dark:bg-slate-900/30">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{item.label}</div>
                <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{item.caption}</div>
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-white">{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function RankedList({ items = [], formatter = (value) => value, tone = 'teal' }) {
  const barTones = {
    teal: 'bg-teal-500/85',
    amber: 'bg-amber-500/85',
    rose: 'bg-rose-500/85',
    emerald: 'bg-emerald-500/85',
  }

  const peakValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-800 dark:text-white">{item.label}</div>
              {item.caption ? <div className="text-xs text-slate-500 dark:text-slate-400">{item.caption}</div> : null}
            </div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatter(item.value)}</div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
            <div
              className={`h-full rounded-full ${barTones[tone] || barTones.teal}`}
              style={{ width: `${Math.max((item.value / peakValue) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function buildChartOptions({
  categories = [],
  colors = ['#14b8a6'],
  chartType = 'line',
  horizontal = false,
  stacked = false,
  yFormatter,
  tooltipFormatter,
  showLegend = false,
}) {
  return {
    chart: {
      type: chartType,
      fontFamily: 'inherit',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors,
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: horizontal ? 0 : 3,
    },
    legend: {
      show: showLegend,
      position: 'bottom',
      fontSize: '12px',
      labels: { colors: '#64748b' },
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
      padding: { left: 8, right: 8, top: 8, bottom: 0 },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
      },
    },
    yaxis: {
      labels: {
        formatter: yFormatter,
        style: { colors: '#64748b', fontSize: '12px' },
      },
    },
    tooltip: {
      theme: 'light',
      y: tooltipFormatter ? { formatter: tooltipFormatter } : undefined,
    },
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 6,
        columnWidth: '42%',
        barHeight: horizontal ? '48%' : undefined,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.2,
        opacityFrom: 0.95,
        opacityTo: 0.7,
        stops: [0, 100],
      },
    },
    markers: {
      size: horizontal ? 0 : 4,
      strokeWidth: 0,
    },
    stacked,
  }
}
