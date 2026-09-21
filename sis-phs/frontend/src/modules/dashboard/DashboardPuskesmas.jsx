import { useState, useEffect } from 'react'
import { DashboardBarChart, DashboardDonutChart, DashboardHeader, MetricCard, ProgressLine, SectionPanel, statusClass } from './DashboardToolkit'
import { dashboardStatusTone } from './roleDashboardLayouts'
import { getDashboardData } from '../../services/api'

import DashboardSkeleton from './DashboardSkeleton'

export default function DashboardPuskesmas() {
  const [filter, setFilter] = useState('')
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDashboardData('puskesmas', filter)
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

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboard Puskesmas"
        description={current.summary}
        filters={filters}
        value={filter}
        onChange={setFilter}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {current.cards.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionPanel title="Capaian Para Kader" subtitle="Leaderboard ini menjadi fokus utama puskesmas untuk membaca kualitas performa lapangan.">
          <div className="space-y-4">
            {current.leaderboard.map((item) => (
              <div key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.visits} kunjungan • {item.drafts} draft aktif</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(dashboardStatusTone(item.status))}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressLine value={item.completion} />
                </div>
                <div className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Completion {item.completion}%</div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Status Wilayah & Catatan Operasional" subtitle="Puskesmas perlu cepat tahu desa mana yang aman dan mana yang perlu tindakan.">
          <div className="grid gap-3 md:grid-cols-3">
            {current.alerts.map((item) => (
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
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-4 font-semibold text-slate-900 dark:text-white">{current.trend.title}</div>
              <div className="h-[280px]">
                <DashboardBarChart categories={current.trend.categories} series={current.trend.series} />
              </div>
            </div>
            <div>
              <div className="mb-4 font-semibold text-slate-900 dark:text-white">{current.donut.title}</div>
              <div className="h-[280px]">
                <DashboardDonutChart labels={current.donut.labels} series={current.donut.series} />
              </div>
            </div>
          </div>
        </SectionPanel>
      </div>

      <SectionPanel title={current.villages.title} subtitle="Ringkasan per desa untuk membantu kepala puskesmas membaca coverage dan mutu hasil wilayah kerja.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                <th className="p-4 font-bold">Desa</th>
                <th className="p-4 font-bold">Survei</th>
                <th className="p-4 font-bold">Valid</th>
                <th className="p-4 font-bold">IKS</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {current.villages.rows.map((row) => (
                <tr key={row.desa} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-4 text-slate-900 dark:text-white">{row.desa}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{row.survei}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{row.valid}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{row.iks}</td>
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
      </SectionPanel>
    </div>
  )
}

