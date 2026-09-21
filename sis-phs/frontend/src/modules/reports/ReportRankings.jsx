import { useEffect, useMemo, useState } from 'react'
import { Building2, Download, Eye, RefreshCcw, Users } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { exportRowsToExcel } from '../../utils/exportExcel'
import {
  fetchRankingsOptions,
  fetchRankingsRecords,
  fetchRankingsStats,
  getRankingStatusMeta,
} from '../../services/adminReportsData'
import {
  ApexChart,
  buildChartOptions,
  ChartCard,
  InfoBlock,
  InsightTextCard,
  SelectField,
} from './reportComponents'

const defaultFilters = {
  year: new Date().getFullYear().toString(),
  period: '',
  districtId: '',
  puskesmasId: '',
  rankingStatus: '',
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value)
}

export default function ReportRankings() {
  const [isLoading, setIsLoading] = useState(true)
  const [options, setOptions] = useState({ years: [], periods: [], districts: [], puskesmas: [], rankingStatuses: [] })
  const [stats, setStats] = useState({ totalPuskesmas: 0, avgIks: '0.00', activeSurveyors: 0, priorityCount: 0 })
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
  
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)
  
  // For exporting and chart
  const [allRows, setAllRows] = useState([])

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const query = new URLSearchParams()
        if (filters.districtId) query.append('districtId', filters.districtId)
        
        const res = await fetchRankingsOptions(query)
        setOptions(res)
      } catch (err) {
        console.error('Failed to load options', err)
      }
    }
    loadOptions()
  }, [filters.districtId])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const query = {
          page,
          perPage: 5,
          search,
          ...filters
        }
        
        const [recordsRes, statsRes, allRowsRes] = await Promise.all([
          fetchRankingsRecords(query),
          fetchRankingsStats(query),
          fetchRankingsRecords({ ...query, page: 1, perPage: 999 })
        ])
        
        setData(recordsRes.data)
        setMeta(recordsRes.meta)
        setStats(statsRes)
        setAllRows(allRowsRes.data)
      } catch (err) {
        console.error('Failed to load data', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [page, search, filters])

  const chartSeries = useMemo(() => ({
    series: [
      { name: 'IKS Rata-rata', data: allRows.map((row) => Number(row.avgIks.toFixed(2))) },
      { name: 'Surveyor Aktif', data: allRows.map((row) => row.activeSurveyors) },
    ],
    options: buildChartOptions({
      chartType: 'bar',
      categories: allRows.map((row) => row.puskesmasName.replace('Puskesmas ', '')),
      colors: ['#14b8a6', '#6366f1'],
      showLegend: true,
      tooltipFormatter: (value) => Number(value).toFixed(2),
    }),
  }), [allRows])

  const rankingList = useMemo(() => allRows.slice().sort((a, b) => b.avgIks - a.avgIks), [allRows])
  const top3 = rankingList.slice(0, 3)

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'districtId') {
        next.puskesmasId = ''
      }
      return next
    })
    setPage(1)
  }

  const handleReset = () => {
    setSearch('')
    setFilters(defaultFilters)
    setPage(1)
  }

  const handleExport = () => {
    exportRowsToExcel({
      filename: 'ranking-puskesmas',
      sheetName: 'Ranking Puskesmas',
      columns: ['Puskesmas', 'Kecamatan', 'Total Responden', 'Tervalidasi', 'IKS Rata-rata', '% Sehat', 'Belum Divalidasi', 'Surveyor Aktif', 'Status'],
      rows: allRows.map((row) => [
        row.puskesmasName,
        row.districtName,
        row.surveyedFamilies,
        row.validatedFamilies,
        row.avgIks,
        row.healthyPct,
        row.backlog,
        row.activeSurveyors,
        getRankingStatusMeta(row.rankingStatus).label,
      ]),
    })
  }

  if (isLoading && !data.length) {
    return (
      <AdminDataPageSkeleton
        title="Ranking Puskesmas"
        description="Peringkat performa antar puskesmas."
        icon={<Building2 size={22} />}
        tableColumnCount={8}
        filterFieldCount={5}
        chartCount={2}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <Building2 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ranking Puskesmas</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Peringkat performa puskesmas berdasarkan capaian IKS dan surveyor aktif.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCcw size={16} />
            Refresh Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Puskesmas" value={formatNumber(stats.totalPuskesmas)} subtitle="Dalam ruang lingkup filter" color="blue" icon={<Building2 size={22} />} />
        <StatCard title="Rata-rata IKS" value={stats.avgIks} subtitle="Rerata IKS wilayah terpilih" color="emerald" icon={<Eye size={22} />} />
        <StatCard title="Total Surveyor Aktif" value={formatNumber(stats.activeSurveyors)} subtitle="Jumlah kader yang telah mengirim survei" color="indigo" icon={<Users size={22} />} />
        <StatCard title="Prioritas Intervensi" value={formatNumber(stats.priorityCount)} subtitle="Puskesmas dengan IKS < 0.4" color="amber" icon={<Building2 size={22} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard eyebrow="Ranking" title="Perbandingan IKS dan Partisipasi Surveyor" description="Korelasi antara rata-rata Indeks Data Sehat dengan keaktifan pengumpulan data oleh surveyor." className="xl:col-span-2">
          <ApexChart type="bar" series={chartSeries.series} options={chartSeries.options} height={320} />
        </ChartCard>
        <InsightTextCard
          title="Sorotan Eksekutif"
          accent="indigo"
          description="Ringkasan cepat untuk mengidentifikasi puskesmas teratas dan terbawah berdasarkan IKS."
          items={
            top3.length > 0
              ? top3.map((p, i) => ({
                  label: `Peringkat ${i + 1}`,
                  caption: `${p.puskesmasName} (Kec. ${p.districtName})`,
                  value: p.avgIks.toFixed(2),
                }))
              : [
                  {
                    label: 'Belum ada data',
                    caption: 'Tidak ada puskesmas yang memenuhi kriteria filter',
                    value: '-',
                  },
                ]
          }
        />
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari puskesmas atau kecamatan..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        >
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download size={14} className="mr-2 inline" />
            Export Rekap
          </button>
        </FilterBar>

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Gunakan filter untuk membatasi ruang lingkup ranking."
        >
          <SelectField label="Tahun" value={filters.year} onChange={(value) => handleFilterChange('year', value)} options={options.years.map((item) => ({ value: item, label: item }))} />
          <SelectField label="Periode" value={filters.period} onChange={(value) => handleFilterChange('period', value)} options={[{ value: '', label: 'Semua Periode' }, ...options.periods]} />
          <SelectField label="Kecamatan" value={filters.districtId} onChange={(value) => handleFilterChange('districtId', value)} options={[{ value: '', label: 'Semua Kecamatan' }, ...options.districts.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Puskesmas" value={filters.puskesmasId} onChange={(value) => handleFilterChange('puskesmasId', value)} options={[{ value: '', label: 'Semua Puskesmas' }, ...options.puskesmas.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Status IKS" value={filters.rankingStatus} onChange={(value) => handleFilterChange('rankingStatus', value)} options={[{ value: '', label: 'Semua Status' }, ...options.rankingStatuses]} />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Puskesmas', 'Kecamatan', 'Responden', 'IKS Rata-rata', '% Sehat', 'Surveyor Aktif', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Belum ada data ranking yang cocok dengan filter aktif."
          >
            {data.map((record) => {
              const statusMeta = getRankingStatusMeta(record.rankingStatus)

              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{record.puskesmasName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.districtName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>{formatNumber(record.surveyedFamilies)} total</div>
                    <div className="text-slate-500 dark:text-slate-400">{formatNumber(record.validatedFamilies)} tervalidasi</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{record.avgIks.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{record.healthyPct}%</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1"><Users size={14} className="text-indigo-500" /> {formatNumber(record.activeSurveyors)} orang</span>
                  </td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${statusMeta.tone}`}>{statusMeta.label}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Detail Puskesmas" onClick={() => setSelectedRecord(record)} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        </div>
      </div>

      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Performa ${selectedRecord.puskesmasName}` : 'Detail Performa'}
        description="Ringkasan metrik kinerja Puskesmas berdasarkan aktivitas pendataan survei."
        footer={(
          <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Tutup
          </button>
        )}
      >
        {selectedRecord ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoBlock label="Puskesmas" value={selectedRecord.puskesmasName} />
            <InfoBlock label="Kecamatan" value={selectedRecord.districtName} />
            <InfoBlock label="IKS Rata-rata" value={selectedRecord.avgIks.toFixed(2)} tone={selectedRecord.avgIks >= 0.6 ? 'success' : 'danger'} />
            <InfoBlock label="Surveyor Aktif" value={formatNumber(selectedRecord.activeSurveyors)} tone={selectedRecord.activeSurveyors > 0 ? 'success' : 'warning'} />
            <InfoBlock label="% Data Sehat" value={`${selectedRecord.healthyPct}%`} />
            <InfoBlock label="Belum Divalidasi" value={formatNumber(selectedRecord.backlog)} tone={selectedRecord.backlog > 50 ? 'danger' : 'info'} />
          </div>
        ) : null}
      </Modal>
    </div>
  )
}



