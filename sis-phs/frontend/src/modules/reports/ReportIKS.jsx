import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, Gauge, RefreshCcw } from 'lucide-react'
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
  fetchIKSReportOptions,
  fetchIKSReportRecords,
  fetchIKSReportStats,
  getRankingStatusMeta,
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
  period: '',
  districtId: '',
  puskesmasId: '',
  villageId: '',
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value || 0)
}

export default function ReportIKS() {
  const { isLoading: isSkeletonLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const [options, setOptions] = useState({ years: [], periods: [], iksLevels: [], districts: [], puskesmas: [], villages: [] })
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [stats, setStats] = useState({ totalRecords: 0, avgIks: '0.00', avgHealthy: 0, totalBacklog: 0, priorityCount: 0 })
  
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const appliedFiltersJson = JSON.stringify(appliedFilters)

  useEffect(() => {
    fetchIKSReportOptions({ districtId: filters.districtId, puskesmasId: filters.puskesmasId })
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
      fetchIKSReportRecords({ page, perPage: 10, search, ...activeFilters }),
      fetchIKSReportStats({ search, ...activeFilters })
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
      const res = await fetchIKSReportRecords({ page: 1, perPage: 999, search, ...filters })
      const exportRows = res.data
      exportRowsToExcel({
        filename: 'laporan-iks-wilayah',
        sheetName: 'IKS Wilayah',
        columns: ['Tahun', 'Periode', 'Kecamatan', 'Puskesmas', 'Desa/Kelurahan', 'Total Responder', 'IKS Rata-rata', '% Sehat', '% Tidak Sehat', 'Belum Divalidasi', 'Status'],
        rows: exportRows.map((row) => [
        row.year,
        options.periods?.find((item) => item.value === row.period)?.label || row.period,
        row.districtName,
        row.puskesmasName,
        row.villageName,
        row.surveyedFamilies,
        row.avgIks,
        row.healthyFamilyPct,
        row.unhealthyPct,
        row.backlog,
        getRankingStatusMeta(row.rankingStatus).label,
      ]),
    })
  } catch(err) {
      console.error(err)
    }
  }

  if (isSkeletonLoading) {
    return (
      <AdminDataPageSkeleton
        title="Laporan IKS Wilayah"
        description="Ringkasan nilai IKS per level wilayah untuk monitoring eksekutif dan prioritas intervensi."
        icon={<Gauge size={22} />}
        tableColumnCount={8}
        filterFieldCount={4}
        chartCount={2}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <Gauge size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Laporan IKS Wilayah</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Melihat performa IKS rata-rata untuk kebutuhan monitoring dan ranking internal.</p>
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
        <StatCard title="Baris Laporan" value={formatNumber(stats.totalRecords)} subtitle="Unit wilayah pada filter aktif" color="blue" icon={<Gauge size={22} />} />
        <StatCard title="Rata-rata IKS" value={stats.avgIks} subtitle="Nilai agregat lintas wilayah" color="teal" icon={<Gauge size={22} />} />
        <StatCard title="Data Sehat" value={`${stats.avgHealthy}%`} subtitle="Persentase Data Sehat rata-rata" color="emerald" icon={<Gauge size={22} />} />
        <StatCard title="Prioritas" value={formatNumber(stats.priorityCount)} subtitle={`Backlog total ${formatNumber(stats.totalBacklog)} keluarga`} color="amber" icon={<Gauge size={22} />} />
      </div>



      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari wilayah, puskesmas, atau desa..."
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
          description="Filter laporan distandarkan agar pembacaan data lintas halaman tetap konsisten."
          summary={`Ekspor mengikuti ${formatNumber(stats.totalRecords)} data IKS pada filter aktif.`}
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
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Kecamatan', 'Puskesmas', 'Desa', 'Total Responder', 'IKS Rata-rata', '% Sehat', 'Belum Divalidasi', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            isLoading={isLoading}
            emptyState="Belum ada data IKS wilayah yang cocok dengan filter saat ini."
          >
            {data.map((record) => {
              const rankingMeta = getRankingStatusMeta(record.rankingStatus)

              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.districtName}</div>
                    <div className="mt-2">
                      <ToneBadge tone={rankingMeta.tone}>{rankingMeta.label}</ToneBadge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-800 dark:text-white">{record.puskesmasName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{record.year} • {options.periods?.find((item) => item.value === record.period)?.label}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.villageName}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{formatNumber(record.surveyedFamilies)}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-amber-600">{record.surveyedFamilies > 0 ? record.avgIks.toFixed(2) : '-'}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-emerald-600">{record.surveyedFamilies > 0 ? `${record.healthyFamilyPct}%` : '-'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Tidak sehat {record.surveyedFamilies > 0 ? `${record.unhealthyPct}%` : '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(record.backlog)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Detail IKS Wilayah" onClick={() => setSelectedRecord(record)} />
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
        title="Detail IKS Wilayah"
        description="Drilldown nilai IKS, distribusi Data Sehat, dan antrean validasi pada baris wilayah terpilih."
        footer={(
          <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Tutup
          </button>
        )}
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBlock label="Kecamatan" value={selectedRecord.districtName} />
              <InfoBlock label="Puskesmas" value={selectedRecord.puskesmasName} />
              <InfoBlock label="Desa/Kelurahan" value={selectedRecord.villageName} />
              <InfoBlock label="IKS Rata-rata" value={selectedRecord.surveyedFamilies > 0 ? selectedRecord.avgIks.toFixed(2) : '-'} tone="info" />
              <InfoBlock label="Total Responder" value={formatNumber(selectedRecord.surveyedFamilies)} tone="success" />
              <InfoBlock label="Persentase Sehat" value={selectedRecord.surveyedFamilies > 0 ? `${selectedRecord.healthyFamilyPct}%` : '-'} tone="success" />
              <InfoBlock label="Belum Divalidasi" value={formatNumber(selectedRecord.backlog)} tone={selectedRecord.backlog > 50 ? 'warning' : 'default'} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-sm font-semibold text-slate-800 dark:text-white">Ringkasan Wilayah</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Wilayah ini memiliki kategori <span className="font-semibold">{getRankingStatusMeta(selectedRecord.rankingStatus).label}</span> dengan Data Tidak Sehat sebesar <span className="font-semibold text-rose-600">{selectedRecord.unhealthyPct}%</span>. Data ini dapat dipakai untuk menyusun ranking internal dan prioritas intervensi.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}





