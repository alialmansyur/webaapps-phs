import { useEffect, useMemo, useState } from 'react'
import { Activity, Download, Eye, RefreshCcw } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { exportRowsToExcel } from '../../utils/exportExcel'
import {
  fetchSurveyIndicatorOptions,
  fetchSurveyIndicatorRecords,
  fetchSurveyIndicatorStats,
} from '../../services/adminReportsData'
import {
  InfoBlock,
  SelectField,
  DateField,
  ToneBadge,
} from './reportComponents'

const defaultFilters = {
  year: new Date().getFullYear().toString(),
  startDate: '',
  endDate: '',
  districtId: '',
  puskesmasId: '',
  villageId: '',
  indicator: '',
  validationStatus: 'all',
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value || 0)
}

export default function ReportSurveyIndicators() {
  const { isLoading: isSkeletonLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const [options, setOptions] = useState({ years: [], periods: [], districts: [], puskesmas: [], villages: [], indicators: [], validationStatuses: [] })
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [stats, setStats] = useState({ indicators: 0, respondents: 0, avgHealthy: 0, lowestIndicator: '-', pending: 0, chartData: [] })
  
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const appliedFiltersJson = JSON.stringify(appliedFilters)

  useEffect(() => {
    fetchSurveyIndicatorOptions({ districtId: filters.districtId, puskesmasId: filters.puskesmasId })
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
      fetchSurveyIndicatorRecords({ page, perPage: 10, search, ...activeFilters }),
      fetchSurveyIndicatorStats({ search, ...activeFilters })
    ]).then(([recordsRes, statsRes]) => {
      setData(recordsRes.data)
      setMeta(recordsRes.meta)
      setStats(statsRes)
    }).catch(console.error).finally(() => setIsLoading(false))
  }, [page, search, appliedFiltersJson, options.years?.[0]])

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
  }

  const handleReset = () => {
    setSearch('')
    const resetFilters = { ...defaultFilters, year: options.years?.[0] || '' }
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
      const res = await fetchSurveyIndicatorRecords({ page: 1, perPage: 999, search, ...appliedFilters })
      const exportRows = res.data
      exportRowsToExcel({
        filename: 'laporan-capaian-indikator-survey',
        sheetName: 'Indikator Survey',
        columns: ['Tahun', 'Indikator', 'Jenis Responden', 'Responden', '% Sehat', '% Tidak Sehat'],
        rows: exportRows.map((row) => [
          row.year,
          row.indicator,
          `ART usia >= ${row.minAge} tahun`,
          row.respondents,
          row.healthyPct,
          row.unhealthyPct,
        ]),
      })
    } catch (err) {
      console.error(err)
    }
  }

  if (isSkeletonLoading) {
    return (
      <AdminDataPageSkeleton
        title="Capaian Indikator Survey"
        description="Analisis hasil survey per indikator untuk mendeteksi area masalah dan prioritas intervensi."
        icon={<Activity size={22} />}
        tableColumnCount={8}
        filterFieldCount={4}
        chartCount={0}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <Activity size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Capaian Indikator Survey</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Menyajikan hasil survey per indikator PHBS/IKS, lengkap dengan status validasi dan distribusi sehat.</p>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Indikator Tampil" value={formatNumber(stats.indicators)} subtitle="Jumlah indikator pada filter aktif" color="blue" icon={<Activity size={22} />} />
        <StatCard title="Responden Terolah" value={formatNumber(stats.respondents)} subtitle="Data agregat siap ekspor" color="teal" icon={<Activity size={22} />} />
        <StatCard title="Rerata Sehat" value={`${stats.avgHealthy}%`} subtitle="Akumulasi lintas indikator" color="emerald" icon={<Activity size={22} />} />
        <StatCard title="Menunggu Validasi" value={formatNumber(stats.pending)} subtitle={`Indikator terendah: ${stats.lowestIndicator}`} color="amber" icon={<Activity size={22} />} />
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari indikator, kecamatan, atau puskesmas..."
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
          description="Filter data tabel dan dashboard berdasarkan periode, unit wilayah, atau indikator spesifik."
          summary={`Menampilkan agregasi dari hasil filter aktif.`}
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
            options={[{ value: '', label: 'Semua Tahun' }, ...(options.years || []).map((item) => ({ value: item, label: item }))]}
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
            label="Indikator"
            value={filters.indicator}
            onChange={(value) => handleFilterChange('indicator', value)}
            options={[{ value: '', label: 'Semua Indikator' }, ...(options.indicators || []).map((item) => ({ value: item.value, label: item.label }))]}
          />
          <SelectField
            label="Kecamatan"
            value={filters.districtId}
            onChange={(value) => handleFilterChange('districtId', value)}
            options={[{ value: '', label: 'Semua Kecamatan' }, ...(options.districts || []).map((item) => ({ value: item.id, label: item.name }))]}
          />
          <SelectField
            label="Puskesmas"
            value={filters.puskesmasId}
            onChange={(value) => handleFilterChange('puskesmasId', value)}
            options={[{ value: '', label: 'Semua Puskesmas' }, ...(options.puskesmas || []).map((item) => ({ value: item.id, label: item.name }))]}
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
          <SelectField
            label="Status Validasi"
            value={filters.validationStatus}
            onChange={(value) => handleFilterChange('validationStatus', value)}
            options={options.validationStatuses || []}
          />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Indikator', 'Jenis Responden', 'Responden', '% Sehat', '% Tidak Sehat', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            isLoading={isLoading}
            emptyState="Belum ada data capaian indikator yang sesuai dengan filter saat ini."
          >
            {data.map((record) => {
              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.indicator}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">ART usia &gt;= {record.minAge} tahun</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(record.respondents)}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">{record.healthyPct}%</td>
                  <td className="px-6 py-4 font-semibold text-rose-600">{record.unhealthyPct}%</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Detail Capaian Indikator" onClick={() => setSelectedRecord(record)} />
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
        title="Detail Capaian Indikator"
        description="Rangkuman distribusi indikator dan konteks validasi untuk wilayah terpilih."
        footer={(
          <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Tutup
          </button>
        )}
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBlock label="Indikator" value={selectedRecord.indicator} />
              <InfoBlock label="Jenis Responden" value={`ART usia >= ${selectedRecord.minAge} tahun`} />
              <InfoBlock label="Responden" value={formatNumber(selectedRecord.respondents)} tone="info" />
              <InfoBlock label="Sehat" value={`${selectedRecord.healthyPct}%`} tone="success" />
              <InfoBlock label="Tidak Sehat" value={`${selectedRecord.unhealthyPct}%`} tone="danger" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-sm font-semibold text-slate-800 dark:text-white">Interpretasi Singkat</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Komposisi tidak sehat pada indikator ini sebesar <span className="font-semibold text-rose-600">{selectedRecord.unhealthyPct}%</span>. Angka ini merupakan agregasi dari seluruh responden yang sesuai dengan filter wilayah dan periode yang sedang aktif.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

