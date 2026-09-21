import { useMemo, useState } from 'react'
import { Building2, Download, Eye, RefreshCcw } from 'lucide-react'
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
  getAggregateReportRecords,
  getAggregateReportStats,
  getAggregateStatusMeta,
  getTargetReportOptions,
} from '../../services/operationalData'
import {
  ApexChart,
  buildChartOptions,
  ChartCard,
  InfoBlock,
  InsightTextCard,
  SelectField,
  ToneBadge,
} from './reportComponents'

const defaultFilters = {
  year: '2026',
  period: 'semester-1',
  districtId: '',
  puskesmasId: '',
  status: '',
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value)
}

export default function ReportAggregate() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const options = getTargetReportOptions({ districtId: filters.districtId })
  const { data, meta } = useMemo(() => getAggregateReportRecords({
    page,
    perPage: 5,
    search,
    districtId: filters.districtId,
    puskesmasId: filters.puskesmasId,
    status: filters.status,
  }), [filters.districtId, filters.puskesmasId, filters.status, page, search])
  const exportRows = useMemo(
    () => getAggregateReportRecords({ page: 1, perPage: 999, search, districtId: filters.districtId, puskesmasId: filters.puskesmasId, status: filters.status }).data,
    [filters.districtId, filters.puskesmasId, filters.status, search],
  )
  const stats = useMemo(() => getAggregateReportStats(exportRows), [exportRows])

  const chartSeries = useMemo(() => ({
    series: [
      { name: 'IKS Rata-rata', data: exportRows.map((row) => Number(row.avgIks.toFixed(2))) },
      { name: 'Belum Divalidasi', data: exportRows.map((row) => row.backlog) },
    ],
    options: buildChartOptions({
      chartType: 'bar',
      categories: exportRows.map((row) => row.puskesmasName.replace('Puskesmas ', '')),
      colors: ['#14b8a6', '#f59e0b'],
      showLegend: true,
      tooltipFormatter: (value) => Number(value).toFixed(2),
    }),
  }), [exportRows])

  const rankingList = useMemo(() => exportRows.slice().sort((a, b) => b.avgIks - a.avgIks), [exportRows])
  const strongest = rankingList[0]
  const weakest = rankingList[rankingList.length - 1]
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

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
      filename: 'laporan-agregat-dinkes',
      sheetName: 'Agregat Dinkes',
      columns: ['Puskesmas', 'Kecamatan', 'Total Responden', 'Tervalidasi', 'IKS', '% Sehat', 'Belum Divalidasi', 'Prioritas Intervensi', 'Status'],
      rows: exportRows.map((row) => [
        row.puskesmasName,
        row.districtName,
        row.totalFamilies,
        row.validatedFamilies,
        row.avgIks,
        row.healthyPct,
        row.backlog,
        row.priorityFamilies,
        getAggregateStatusMeta(row.status).label,
      ]),
    })
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Laporan Agregat Wilayah"
        description="Rekap agregat lintas Puskesmas."
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
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Laporan Agregat Wilayah</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rekap agregat lintas Puskesmas.</p>
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
          <button type="button" onClick={handleExport} className="master-primary-btn px-4 py-3 text-sm font-semibold">
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Responden" value={formatNumber(stats.totalFamilies)} subtitle="Keluarga masuk agregasi aktif" color="blue" icon={<Building2 size={22} />} />
        <StatCard title="Tervalidasi" value={formatNumber(stats.validatedFamilies)} subtitle="Data sudah lolos pemeriksaan" color="emerald" icon={<Eye size={22} />} />
        <StatCard title="Rata-rata IKS" value={stats.avgIks} subtitle="Ringkasan kualitas wilayah aktif" color="teal" icon={<Building2 size={22} />} />
        <StatCard title="Prioritas Intervensi" value={formatNumber(stats.priorityFamilies)} subtitle={`Backlog total ${formatNumber(stats.totalBacklog)}`} color="amber" icon={<Eye size={22} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard eyebrow="Ranking" title="Perbandingan IKS dan Belum Divalidasi per Puskesmas" description="Membaca kualitas wilayah tanpa melepaskan konteks backlog verifikasi dan Prioritas Intervensi." className="xl:col-span-2">
          <ApexChart type="bar" series={chartSeries.series} options={chartSeries.options} height={320} />
        </ChartCard>
        <InsightTextCard
          title="Sorotan Eksekutif"
          accent="amber"
          description="Ringkasan cepat untuk membantu Dinkes menentukan wilayah yang perlu pengawalan lebih dekat."
          items={[
            {
              label: 'Puskesmas terkuat',
              caption: strongest ? `${strongest.puskesmasName} dengan ${strongest.healthyPct}% Data Sehat` : 'Belum ada data',
              value: strongest ? strongest.avgIks.toFixed(2) : '-',
            },
            {
              label: 'Puskesmas terendah',
              caption: weakest ? `${formatNumber(weakest.backlog)} belum divalidasi dan ${formatNumber(weakest.priorityFamilies)} Prioritas Intervensi` : 'Belum ada data',
              value: weakest ? weakest.avgIks.toFixed(2) : '-',
            },
          ]}
        />
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari kecamatan atau puskesmas..."
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
            Export Data
          </button>
        </FilterBar>

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Gunakan filter untuk membaca capaian agregat per periode, wilayah, dan status kualitas unit layanan."
        >
          <SelectField label="Tahun" value={filters.year} onChange={(value) => handleFilterChange('year', value)} options={options.years.map((item) => ({ value: item, label: item }))} />
          <SelectField label="Periode" value={filters.period} onChange={(value) => handleFilterChange('period', value)} options={options.periods} />
          <SelectField label="Kecamatan" value={filters.districtId} onChange={(value) => handleFilterChange('districtId', value)} options={[{ value: '', label: 'Semua Kecamatan' }, ...options.districts.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Puskesmas" value={filters.puskesmasId} onChange={(value) => handleFilterChange('puskesmasId', value)} options={[{ value: '', label: 'Semua Puskesmas' }, ...options.puskesmas.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Status" value={filters.status} onChange={(value) => handleFilterChange('status', value)} options={[{ value: '', label: 'Semua Status' }, { value: 'GOOD', label: 'Sangat Baik' }, { value: 'STABLE', label: 'Stabil' }, { value: 'WARNING', label: 'Waspada' }, { value: 'PRIORITY', label: 'Prioritas' }]} />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Puskesmas', 'Kecamatan', 'Responden', 'IKS', '% Sehat', 'Belum Divalidasi', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Belum ada baris laporan agregat yang cocok dengan filter aktif."
          >
            {data.map((record) => {
              const statusMeta = getAggregateStatusMeta(record.status)

              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{record.puskesmasName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.districtName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>{formatNumber(record.totalFamilies)} total</div>
                    <div className="text-slate-500 dark:text-slate-400">{formatNumber(record.validatedFamilies)} tervalidasi</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{record.avgIks.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{record.healthyPct}%</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(record.backlog)}</td>
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
        title={selectedRecord ? `Drilldown ${selectedRecord.puskesmasName}` : 'Drilldown Puskesmas'}
        description="Detail cepat untuk pembacaan manajerial tanpa keluar dari halaman laporan agregat."
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
            <InfoBlock label="IKS Rata-rata" value={selectedRecord.avgIks.toFixed(2)} tone={selectedRecord.avgIks >= 0.7 ? 'success' : selectedRecord.avgIks >= 0.5 ? 'warning' : 'danger'} />
            <InfoBlock label="Prioritas Intervensi" value={formatNumber(selectedRecord.priorityFamilies)} />
            <InfoBlock label="Belum Divalidasi" value={formatNumber(selectedRecord.backlog)} tone={selectedRecord.backlog > 150 ? 'danger' : 'warning'} />
            <InfoBlock label="% Data Sehat" value={`${selectedRecord.healthyPct}%`} />
          </div>
        ) : null}
      </Modal>
    </div>
  )
}



