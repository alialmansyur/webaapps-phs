import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Download, Eye, RefreshCcw } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { exportRowsToExcel } from '../../utils/exportExcel'
import {
  fetchSurveyProgressOptions,
  fetchSurveyProgressRecords,
  fetchSurveyProgressStats,
} from '../../services/adminReportsData'
import {
  SelectField,
  DateField,
} from './reportComponents'

const defaultFilters = {
  year: new Date().getFullYear().toString(),
  startDate: '',
  endDate: '',
  districtId: '',
  puskesmasId: '',
  villageId: '',
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value || 0)
}

export default function ReportSurveyProgress() {
  const { isLoading: isSkeletonLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)

  const [options, setOptions] = useState({ years: [], periods: [], districts: [], puskesmas: [], villages: [] })
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [stats, setStats] = useState({ surveyed: 0, validated: 0, backlog: 0, chartData: [], totalUsers: 0 })
  
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const appliedFiltersJson = JSON.stringify(appliedFilters)

  useEffect(() => {
    fetchSurveyProgressOptions({ districtId: filters.districtId, puskesmasId: filters.puskesmasId })
      .then(res => setOptions(res))
      .catch(console.error)
  }, [filters.districtId, filters.puskesmasId])

  useEffect(() => {
    setIsLoading(true)
    const activeFilters = JSON.parse(appliedFiltersJson)
    if (!activeFilters.year && !activeFilters.startDate && !activeFilters.endDate && options.years && options.years.length > 0) {
      activeFilters.year = options.years[0]
    }
    
    Promise.all([
      fetchSurveyProgressRecords({ page, perPage: 10, search, ...activeFilters }),
      fetchSurveyProgressStats({ search, ...activeFilters })
    ]).then(([recordsRes, statsRes]) => {
      setData(recordsRes.data)
      setMeta(recordsRes.meta)
      setStats(statsRes)
    }).catch(console.error).finally(() => setIsLoading(false))
  }, [page, search, appliedFiltersJson, options.years])

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length + (search ? 1 : 0)

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'districtId') {
        next.puskesmasId = ''
        next.villageId = ''
      }
      if (key === 'puskesmasId') {
        next.villageId = ''
      }
      return next
    })
    setPage(1)
  }

  const handleReset = () => {
    setSearch('')
    const resetFilters = { ...defaultFilters, year: options.years[0] || '' }
    setFilters(resetFilters)
    setAppliedFilters(resetFilters)
    setPage(1)
  }

  const handleApply = () => {
    setAppliedFilters(filters)
    setPage(1)
  }

  const handleExport = async () => {
    try {
      const res = await fetchSurveyProgressRecords({ page: 1, perPage: 999, search, ...appliedFilters })
      const exportRows = res.data
      exportRowsToExcel({
        filename: 'laporan-progress-survey',
        sheetName: 'Progress Survey',
        columns: ['Tahun', 'Kecamatan', 'Puskesmas', 'Desa/Kelurahan', 'Kader', 'Tersurvey', 'Tervalidasi', 'Belum Divalidasi'],
        rows: exportRows.map((row) => [
          row.year,
          row.districtName,
          row.puskesmasName,
          row.villageName,
          row.kaderName,
          row.surveyedHouseholds,
          row.validatedHouseholds,
          row.pendingHouseholds,
        ]),
      })
    } catch (err) {
      console.error(err)
    }
  }

  if (isSkeletonLoading) {
    return (
      <AdminDataPageSkeleton
        title="Progress Survey"
        description="Monitoring realisasi dan validasi survey lintas wilayah."
        icon={<BarChart3 size={22} />}
        tableColumnCount={5}
        filterFieldCount={4}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Progress Survey</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memantau realisasi survey dan antrean validasi per wilayah kerja.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              handleReset()
              triggerSkeleton()
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCcw size={16} />
            Refresh Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tersurvey" value={formatNumber(stats.surveyed)} subtitle="Total survei/responder" color="teal" icon={<BarChart3 size={22} />} />
        <StatCard title="Tervalidasi" value={formatNumber(stats.validated)} subtitle="Survei disetujui puskesmas" color="emerald" icon={<BarChart3 size={22} />} />
        <StatCard title="Belum Divalidasi" value={formatNumber(stats.backlog)} subtitle="Menunggu validasi" color="amber" icon={<BarChart3 size={22} />} />
        <StatCard title="Target Data Sehat" value={`${stats.avgHealthy}%`} subtitle="Dari data survei aktual" color="blue" icon={<BarChart3 size={22} />} targetValue={stats.targetValue} currentValue={stats.avgHealthy} targetLabel={`Target: ${stats.targetValue}%`} />
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari kecamatan, puskesmas, desa, atau nama kader..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
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
          onApply={handleApply}
          description="Filter laporan berdasarkan kader, waktu, dan wilayah bertugas."
          summary={`Menampilkan kinerja dari ${formatNumber(stats.totalUsers)} filter aktif.`}
        >
          <SelectField
            label="Tahun"
            value={filters.year}
            onChange={(value) => {
              const next = { ...filters, year: value }
              if (value) {
                next.startDate = ''
                next.endDate = ''
              }
              setFilters(next)
              setPage(1)
            }}
            options={[{ value: '', label: 'Semua Tahun' }, ...options.years.map((item) => ({ value: item, label: item }))]}
          />
          <DateField
            label="Tanggal Mulai"
            value={filters.startDate}
            onChange={(value) => {
              const next = { ...filters, startDate: value }
              if (value) next.year = ''
              setFilters(next)
              setPage(1)
            }}
          />
          <DateField
            label="Tanggal Selesai"
            value={filters.endDate}
            onChange={(value) => {
              const next = { ...filters, endDate: value }
              if (value) next.year = ''
              setFilters(next)
              setPage(1)
            }}
          />
          <SelectField
            label="Kecamatan"
            value={filters.districtId}
            onChange={(value) => handleFilterChange('districtId', value)}
            options={[{ value: '', label: 'Semua Kecamatan' }, ...options.districts.map((item) => ({ value: item.id, label: item.name }))]}
          />
          <SelectField
            label="Puskesmas"
            value={filters.puskesmasId}
            onChange={(value) => handleFilterChange('puskesmasId', value)}
            options={[{ value: '', label: 'Semua Puskesmas' }, ...options.puskesmas.map((item) => ({ value: item.id, label: item.name }))]}
          />
          <SelectField
            label="Desa/Kelurahan"
            value={filters.villageId}
            onChange={(value) => handleFilterChange('villageId', value)}
            options={
              options.villages?.length > 0
                ? [{ value: '', label: 'Semua Desa/Kelurahan' }, ...options.villages.map((item) => ({ value: item.id, label: item.name }))]
                : [{ value: '', label: 'Pilih Kecamatan/Puskesmas dahulu' }]
            }
            disabled={!options.villages || options.villages.length === 0}
          />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Wilayah', 'Puskesmas', 'Desa/Kelurahan', 'Tersurvey', 'Tervalidasi']}
            pagination={meta}
            onPageChange={setPage}
            isLoading={isLoading}
            emptyState="Belum ada data progress survey yang cocok dengan filter saat ini."
          >
            {data.map((record) => (
              <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 dark:text-white">{record.districtName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Tahun {record.year}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.puskesmasName}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-800 dark:text-white">{record.villageName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Kader: {record.kaderName}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(record.surveyedHouseholds)} Responder</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-emerald-600">{formatNumber(record.validatedHouseholds)} Responder</div>
                  <div className="text-xs text-amber-500 mt-1">Belum Divalidasi {formatNumber(record.pendingHouseholds)}</div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>
    </div>
  )
}


