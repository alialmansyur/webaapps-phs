import { useState, useEffect } from 'react'
import { DashboardBarChart, DashboardDonutChart, DashboardHeader, MetricCard, ProgressLine, SectionPanel, statusClass } from './DashboardToolkit'
import { dashboardStatusTone } from './roleDashboardLayouts'
import { getDashboardData } from '../../services/api'

import DashboardSkeleton from './DashboardSkeleton'

export default function DashboardAdmin() {
  const [filter, setFilter] = useState('')
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDashboardData('admin', filter)
      .then((res) => {
        setDashboardData(res)
        const availableFilters = Array.isArray(res?.filters) ? res.filters : []
        const activeFilter = String(res?.selectedFilter || '')

        if (activeFilter && activeFilter !== filter) {
          setFilter(activeFilter)
        } else if (!filter && availableFilters.length > 0) {
          setFilter(String(availableFilters[0].value))
        }

        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load dashboard:', err)
        setLoading(false)
      })
  }, [filter])

  if (loading || !dashboardData) {
    return <DashboardSkeleton />
  }

  const current = dashboardData.data
  const filters = dashboardData.filters
  const selectedFilter = dashboardData.selectedFilter || filter || filters?.[0]?.value || ''

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboard Admin"
        description={current.summary}
        filters={filters}
        value={selectedFilter}
        onChange={setFilter}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {current.cards.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionPanel title="Representasi 3 Dashboard Utama" subtitle="Admin membaca garis besar dashboard kader, puskesmas, dan dinkes dalam satu tempat.">
          <div className="space-y-4">
            {current.topInsights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{item.value}</div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.note}</p>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title={current.trend.title} subtitle="Admin memerlukan pandangan proses end-to-end dari masuk hingga valid.">
          <div className="h-[360px]">
            <DashboardBarChart categories={current.trend.categories} series={current.trend.series} />
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionPanel title={current.donut.title} subtitle="Komposisi sistem untuk membaca mutu proses validasi secara cepat.">
          <div className="h-[320px]">
            <DashboardDonutChart labels={current.donut.labels} series={current.donut.series} />
          </div>
          <div className="mt-6 space-y-4">
            {current.supporting.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{item.label}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.note}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(dashboardStatusTone(item.status))}`}>
                    {item.value}
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressLine value={item.progress} />
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title={current.regions.title} subtitle="Ringkasan wilayah prioritas yang menjadi titik temu semua level dashboard.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                  <th className="p-4 font-bold">Wilayah</th>
                  <th className="p-4 font-bold">Target</th>
                  <th className="p-4 font-bold">Realisasi</th>
                  <th className="p-4 font-bold">Coverage</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {current.regions.rows.map((row) => (
                  <tr key={row.area} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-4 text-slate-900 dark:text-white">{row.area}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{row.target}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{row.realisasi}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{row.coverage}</td>
                    <td className="p-4">
                      <span className={`rounded-xl px-3 py-1.5 text-xs font-bold ${statusClass(dashboardStatusTone(row.status))}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {current.adminNotes.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(dashboardStatusTone(item.status))}`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  )
}

