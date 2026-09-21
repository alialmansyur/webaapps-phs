import { useMemo, useState } from 'react'
import { Download, Eye, Landmark, RefreshCcw } from 'lucide-react'
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
  getAggregateStatusMeta,
  getDesaReportRecords,
  getDesaReportStats,
  getTargetReportOptions,
} from '../../services/operationalData'
import {
  ApexChart,
  buildChartOptions,
  ChartCard,
  InfoBlock,
  InsightTextCard,
  SelectField,
} from './reportComponents'

const defaultFilters = {
  year: '2026',
  period: 'semester-1',
  districtId: '',
  puskesmasId: '',
  villageId: '',
  status: '',
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value)
}

export default function ReportDesa() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const options = getTargetReportOptions({
    districtId: filters.districtId,
    puskesmasId: filters.puskesmasId,
  })

  const { data, meta } = useMemo(() => getDesaReportRecords({
    page,
    perPage: 5,
    search,
    districtId: filters.districtId,
    puskesmasId: filters.puskesmasId,
    villageId: filters.villageId,
    status: filters.status,
  }), [filters.districtId, filters.puskesmasId, filters.status, filters.villageId, page, search])
  const exportRows = useMemo(
    () => getDesaReportRecords({ page: 1, perPage: 999, search, districtId: filters.districtId, puskesmasId: filters.puskesmasId, villageId: filters.villageId, status: filters.status }).data,
    [filters.districtId, filters.puskesmasId, filters.status, filters.villageId, search],
  )
  const stats = useMemo(() => getDesaReportStats(exportRows), [exportRows])

  const chart = useMemo(() => ({
    series: [
      { name: '% Sehat', data: exportRows.map((row) => row.healthyPct) },
      { name: '% Tidak Sehat', data: exportRows.map((row) => row.unhealthyPct) },
    ],
    options: buildChartOptions({
      chartType: 'bar',
      categories: exportRows.map((row) => row.villageName.replace('Desa ', '')),
      colors: ['#10b981', '#ef4444'],
      showLegend: true,
      tooltipFormatter: (value) => `${Math.round(value)}%`,
    }),
  }), [exportRows])

  const strongest = useMemo(() => exportRows.slice().sort((a, b) => b.avgIks - a.avgIks)[0], [exportRows])
  const weakest = useMemo(() => exportRows.slice().sort((a, b) => a.avgIks - b.avgIks)[0], [exportRows])
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

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
    setFilters(defaultFilters)
    setPage(1)
  }

  const handleExport = () => {
    exportRowsToExcel({
      filename: 'laporan-desa-puskesmas',
      sheetName: 'Laporan Desa',
      columns: ['Desa', 'Kecamatan', 'Puskesmas', 'Responden', 'IKS', '% Sehat', '% Tidak Sehat', 'Belum Divalidasi', 'Indikator Dominan', 'Status'],
      rows: exportRows.map((row) => [
        row.villageName,
        row.districtName,
        row.puskesmasName,
        row.totalRespondents,
        row.avgIks,
        row.healthyPct,
        row.unhealthyPct,
        row.backlog,
        row.dominantIndicator,
        getAggregateStatusMeta(row.status).label,
      ]),
    })
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Laporan Capaian Desa"
        description="Rekap capaian desa wilayah kerja."
        icon={<Landmark size={22} />}
        tableColumnCount={8}
        filterFieldCount={6}
        chartCount={2}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <Landmark size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Laporan Capaian Desa</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rekap capaian desa wilayah kerja.</p>
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
        <StatCard title="Desa Tampil" value={String(stats.villages)} subtitle="Jumlah desa pada filter aktif" color="blue" icon={<Landmark size={22} />} />
        <StatCard title="Responden" value={formatNumber(stats.totalRespondents)} subtitle="Akumulasi responden seluruh desa" color="teal" icon={<Landmark size={22} />} />
        <StatCard title="Rata-rata IKS" value={stats.avgIks} subtitle="Membaca kualitas capaian per desa" color="emerald" icon={<Landmark size={22} />} />
        <StatCard title="Belum Divalidasi" value={formatNumber(stats.totalBacklog)} subtitle={`${stats.avgHealthy}% sehat rata-rata`} color="amber" icon={<Landmark size={22} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard eyebrow="Distribusi Desa" title="Perbandingan sehat vs tidak sehat" description="Membantu Puskesmas melihat desa mana yang perlu intervensi atau validasi tambahan." className="xl:col-span-2">
          <ApexChart type="bar" series={chart.series} options={chart.options} height={320} />
        </ChartCard>
        <InsightTextCard
          title="Highlight Wilayah"
          accent="emerald"
          description="Ringkasannya diposisikan untuk mendukung briefing internal Puskesmas tanpa harus membaca seluruh tabel."
          items={[
            {
              label: 'Desa terkuat',
              caption: strongest ? `${strongest.villageName} dengan ${strongest.totalRespondents} responden` : 'Belum ada data',
              value: strongest ? strongest.avgIks.toFixed(2) : '-',
            },
            {
              label: 'Desa terlemah',
              caption: weakest ? `${weakest.dominantIndicator} menjadi isu dominan` : 'Belum ada data',
              value: weakest ? weakest.avgIks.toFixed(2) : '-',
            },
          ]}
        />
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari desa, kecamatan, puskesmas, atau indikator dominan..."
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
          description="Saring laporan berdasarkan periode, hierarki wilayah, dan status capaian untuk mempercepat analisis Puskesmas."
        >
          <SelectField label="Tahun" value={filters.year} onChange={(value) => handleFilterChange('year', value)} options={options.years.map((item) => ({ value: item, label: item }))} />
          <SelectField label="Periode" value={filters.period} onChange={(value) => handleFilterChange('period', value)} options={options.periods} />
          <SelectField label="Kecamatan" value={filters.districtId} onChange={(value) => handleFilterChange('districtId', value)} options={[{ value: '', label: 'Semua Kecamatan' }, ...options.districts.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Puskesmas" value={filters.puskesmasId} onChange={(value) => handleFilterChange('puskesmasId', value)} options={[{ value: '', label: 'Semua Puskesmas' }, ...options.puskesmas.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Desa" value={filters.villageId} onChange={(value) => handleFilterChange('villageId', value)} options={[{ value: '', label: 'Semua Desa' }, ...options.villages.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Status" value={filters.status} onChange={(value) => handleFilterChange('status', value)} options={[{ value: '', label: 'Semua Status' }, { value: 'STABLE', label: 'Stabil' }, { value: 'WARNING', label: 'Waspada' }, { value: 'PRIORITY', label: 'Prioritas' }]} />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Desa', 'Responden', 'IKS', '% Sehat', '% Tidak Sehat', 'Belum Divalidasi', 'Indikator', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Belum ada data desa yang cocok dengan filter aktif."
          >
            {data.map((record) => (
              <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 dark:text-white">{record.villageName}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{record.districtName}</div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{formatNumber(record.totalRespondents)}</td>
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{record.avgIks.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-emerald-700 dark:text-emerald-300">{record.healthyPct}%</td>
                <td className="px-6 py-4 text-sm text-rose-700 dark:text-rose-300">{record.unhealthyPct}%</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(record.backlog)}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.dominantIndicator}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <TableActionButton icon={<Eye size={16} />} label="Detail Desa" onClick={() => setSelectedRecord(record)} />
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>

      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Detail ${selectedRecord.villageName}` : 'Detail Desa'}
        description="Drilldown singkat untuk capaian desa, antrean validasi, dan isu dominan yang perlu dikawal."
        footer={(
          <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Tutup
          </button>
        )}
      >
        {selectedRecord ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoBlock label="Desa" value={selectedRecord.villageName} />
            <InfoBlock label="Kecamatan" value={selectedRecord.districtName} />
            <InfoBlock label="Puskesmas" value={selectedRecord.puskesmasName} />
            <InfoBlock label="Responden" value={formatNumber(selectedRecord.totalRespondents)} />
            <InfoBlock label="IKS" value={selectedRecord.avgIks.toFixed(2)} tone={selectedRecord.avgIks >= 0.7 ? 'success' : selectedRecord.avgIks >= 0.5 ? 'warning' : 'danger'} />
            <InfoBlock label="Belum Divalidasi" value={formatNumber(selectedRecord.backlog)} tone={selectedRecord.backlog > 25 ? 'danger' : 'warning'} />
            <InfoBlock label="% Sehat" value={`${selectedRecord.healthyPct}%`} />
            <InfoBlock label="Indikator Dominan" value={selectedRecord.dominantIndicator} />
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

