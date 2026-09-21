import { useMemo, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import { Activity, Download, FileText, Filter, TrendingUp, Users } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { simpleDashboardConfigs } from './dashboardData'

const iconMap = {
  activity: Activity,
  users: Users,
  trending: TrendingUp,
  file: FileText,
}

function getStatusTone(status) {
  const value = String(status || '').toLowerCase()
  if (value.includes('baik') || value.includes('selesai') || value.includes('valid')) return 'text-teal-600 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-300'
  if (value.includes('stabil') || value.includes('draft') || value.includes('pantau')) return 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300'
  if (value.includes('revisi') || value.includes('intervensi')) return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300'
  return 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300'
}

export default function RoleDashboardSimple({ roleKey }) {
  const config = simpleDashboardConfigs[roleKey]
  const defaultFilter = config.filters[0]?.value
  const [activeFilter, setActiveFilter] = useState(defaultFilter)

  const current = config.dataByFilter[activeFilter]
  const HeaderIcon = iconMap[config.icon] || Activity

  const trendOptions = useMemo(() => ({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    colors: ['#14b8a6', '#0ea5e9'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '42%' } },
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      categories: current.trendCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#64748b' } },
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'left' },
  }), [current.trendCategories])

  const donutOptions = useMemo(() => ({
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: current.donutLabels,
    colors: ['#14b8a6', '#f59e0b', '#ef4444'],
    plotOptions: { pie: { donut: { size: '74%' } } },
    dataLabels: { enabled: false },
    legend: { position: 'bottom' },
    stroke: { width: 0 },
  }), [current.donutLabels])

  return (
    <div className="space-y-6">
      <div className="app-panel-shell flex flex-col justify-between gap-4 p-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="app-panel-icon bg-teal-100 p-2 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300">
              <HeaderIcon size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{config.title}</h2>
          </div>
          <p className="max-w-3xl text-sm font-medium text-slate-500 dark:text-slate-400">{config.description}</p>
          {current.highlights?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {current.highlights.map((item) => (
                <span
                  key={item.label}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {item.label}: <span className="text-slate-900 dark:text-white">{item.value}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex gap-3">
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
            className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-900 dark:text-slate-300"
          >
            {config.filters.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button className="flex items-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-teal-600">
            <Download size={18} />
            <span className="hidden sm:inline">Export Laporan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {current.cards.map((stat) => {
          const Icon = iconMap[stat.icon] || Activity
          return (
            <StatCard
              key={stat.label}
              title={stat.label}
              value={stat.value}
              subtitle={stat.subtitle}
              color={stat.color}
              icon={<Icon className="h-6 w-6" />}
            />
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="app-panel-shell lg:col-span-2 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white">{current.trendLabel}</h3>
            <button className="rounded-xl bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800">
              <Filter size={18} />
            </button>
          </div>
          <div className="h-[300px]">
            <ReactApexChart options={trendOptions} series={current.trendSeries} type="bar" height="100%" />
          </div>
        </div>

        <div className="app-panel-shell p-6">
          <h3 className="mb-6 font-bold text-slate-800 dark:text-white">{current.donutLabel}</h3>
          <div className="h-[300px]">
            <ReactApexChart options={donutOptions} series={current.donutSeries} type="donut" height="100%" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="app-panel-shell p-6">
          <div className="mb-5">
            <h3 className="font-bold text-slate-800 dark:text-white">{current.insightTitle || 'Insight Cepat'}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{current.insightDescription || 'Catatan penting untuk membantu membaca dashboard lebih cepat.'}</p>
          </div>
          <div className="space-y-3">
            {current.insights?.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                  {item.badge ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusTone(item.badge)}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="app-panel-shell p-6">
          <div className="mb-5">
            <h3 className="font-bold text-slate-800 dark:text-white">{current.focusTitle || 'Fokus Utama'}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{current.focusDescription || 'Sorotan data yang paling layak diprioritaskan.'}</p>
          </div>
          <div className="space-y-4">
            {current.focusItems?.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{item.label}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.note}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusTone(item.status || item.value)}`}>
                    {item.value}
                  </span>
                </div>
                {typeof item.progress === 'number' ? (
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-sky-500"
                        style={{ width: `${Math.max(0, Math.min(item.progress, 100))}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="app-panel-shell overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-700/50">
          <h3 className="font-bold text-slate-800 dark:text-white">{current.tableTitle}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                {current.tableColumns.map((column) => (
                  <th key={column.key} className="p-4 font-bold">{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {current.tableRows.map((row, index) => (
                <tr key={`${row[current.tableColumns[0].key]}-${index}`} className="border-b border-slate-50 transition-colors hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/50">
                  {current.tableColumns.map((column) => (
                    <td key={column.key} className="p-4 text-slate-800 dark:text-slate-200">
                      {column.key === 'status' ? (
                        <span className={`rounded-xl px-3 py-1.5 text-xs font-bold ${getStatusTone(row[column.key])}`}>
                          {row[column.key]}
                        </span>
                      ) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
