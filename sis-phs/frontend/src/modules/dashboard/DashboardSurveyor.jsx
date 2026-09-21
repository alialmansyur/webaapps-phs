import { useState, useEffect } from 'react'
import { DashboardBarChart, DashboardDonutChart, DashboardHeader, MetricCard, ProgressLine, SectionPanel, statusClass } from './DashboardToolkit'
import { dashboardStatusTone } from './roleDashboardLayouts'
import { getDashboardData } from '../../services/api'

import DashboardSkeleton from './DashboardSkeleton'

export default function DashboardSurveyor() {
  const [filter, setFilter] = useState('week')
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDashboardData('kader', filter)
      .then((res) => {
        setDashboardData(res)
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
        title={`Dashboard Kader - ${current.greeting}`}
        description={current.subtitle}
        filters={filters}
        value={filter}
        onChange={setFilter}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {current.heroStats.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{item.label}</div>
              <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </DashboardHeader>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionPanel title={current.progress.label} subtitle={current.progress.note}>
          <div className="text-4xl font-black text-slate-900 dark:text-white">{current.progress.value}%</div>
          <div className="mt-4">
            <ProgressLine value={current.progress.value} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {current.cards.map((item) => (
              <MetricCard key={item.label} {...item} />
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Reminder & Agenda" subtitle="Dorongan kerja harian agar pengisian tidak tertinggal.">
          <div className="space-y-3">
            {current.reminders.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(dashboardStatusTone(item.status))}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{item.time}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionPanel title={current.trend.title}>
          <div className="h-[320px]">
            <DashboardBarChart categories={current.trend.categories} series={current.trend.series} />
          </div>
        </SectionPanel>

        <SectionPanel title={current.donut.title}>
          <div className="h-[320px]">
            <DashboardDonutChart labels={current.donut.labels} series={current.donut.series} />
          </div>
        </SectionPanel>
      </div>

      <SectionPanel title={current.families.title} subtitle="Daftar responden yang masih perlu diinput, ditinjau, atau ditindaklanjuti.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                <th className="p-4 font-bold">Responden</th>
                <th className="p-4 font-bold">Alamat</th>
                <th className="p-4 font-bold">Progress</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {current.families.rows.map((row) => (
                <tr key={`${row.keluarga}-${row.alamat}`} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-4 text-slate-900 dark:text-white">{row.keluarga}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{row.alamat}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{row.progress}</td>
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

