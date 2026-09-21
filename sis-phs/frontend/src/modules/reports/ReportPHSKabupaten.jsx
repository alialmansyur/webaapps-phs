import { useEffect, useMemo, useState } from 'react'
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
  fetchPHSKabupatenOptions,
  fetchPHSKabupatenRecords,
  fetchPHSKabupatenStats,
} from '../../services/adminReportsData'
import {
  InfoBlock,
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

export default function ReportPHSKabupaten() {
  const { isLoading: isSkeletonLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const [options, setOptions] = useState({ years: [], districts: [], puskesmas: [], villages: [] })
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [stats, setStats] = useState({ districts: 0, puskesmas: 0, villages: 0, avgHealthy: 0, avgUnhealthy: 0 })
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
  const appliedFiltersJson = JSON.stringify(appliedFilters)

  useEffect(() => {
    fetchPHSKabupatenOptions({ districtId: filters.districtId, puskesmasId: filters.puskesmasId })
      .then(res => setOptions(res))
      .catch(console.error)
  }, [filters.districtId, filters.puskesmasId])

  useEffect(() => {
    setIsLoading(true)
    const activeFilters = JSON.parse(appliedFiltersJson)
    if (!activeFilters.year && !activeFilters.startDate && !activeFilters.endDate && options.years.length > 0) {
      activeFilters.year = options.years[0]
    }
    
    Promise.all([
      fetchPHSKabupatenRecords({ page, perPage: 10, search, ...activeFilters }),
      fetchPHSKabupatenStats({ search, ...activeFilters })
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
      const res = await fetchPHSKabupatenRecords({ page: 1, perPage: 999, search, ...appliedFilters })
      const exportRows = res.data
      exportRowsToExcel({
        filename: 'rekap-phbs-kabupaten',
        sheetName: 'PHS Kabupaten',
        columns: [
          'N0', 'KECAMATAN', 'PUSKESMAS', 'DESA / KELURAHAN', 
          'Jumlah seluruh Individu/Anggota Rumah Tangga (ART) yang disurvei', 
          'Jumlah Individu/Anggota Rumah Tangga (ART) umur >= 5 tahun yang Disurvei', 
          'Jumlah Individu/Anggota Rumah Tangga (ART) umur >= 10 tahun yang Disurvei', 
          'Jumlah Individu/Anggota Rumah Tangga (ART) umur >= 15 tahun yang Disurvei', 
          'Jumlah Individu/Anggota Rumah Tangga (ART) umur >= 5 tahun yang konsumsi buah dan/atau sayur', 
          'Jumlah Individu/Anggota Rumah Tangga (ART) umur >= 10 tahun yang melakukan aktivitas fisik', 
          'Jumlah Individu/Anggota Rumah Tangga (ART) umur >= 10 tahun yang mencuci tangan dengan benar', 
          'Jumlah Individu/Anggota Rumah Tangga (ART) umur >= 10 tahun yang tidak merokok', 
          'Jumlah Individu/Anggota Rumah Tangga (ART) umur >= 15 tahun yang melakukan cek tekanan darah', 
          'Jumlah Individu/Anggota Rumah Tangga (ART) umur >= 15 tahun yang melakukan cek gula darah', 
          'Sehat', '% Sehat', 'Tidak Sehat', '% Tidak Sehat'
        ],
        rows: exportRows.map((row, index) => [
          index + 1,
          row.districtName,
          row.puskesmasName,
          row.villageName,
          row.artTotal,
          row.artAge5,
          row.artAge10,
          row.artAge15,
          row.fruitVegetableHealthy,
          row.physicalActivityHealthy,
          row.handWashingHealthy,
          row.noSmokingHealthy,
          row.bloodPressureCheckHealthy,
          row.bloodSugarCheckHealthy,
          row.healthyIndividuals,
          row.artTotal > 0 ? Math.round((row.healthyIndividuals / row.artTotal) * 100) : 0,
          row.unhealthyIndividuals,
          row.artTotal > 0 ? Math.round((row.unhealthyIndividuals / row.artTotal) * 100) : 0,
        ]),
      })
    } catch(err) {
      console.error(err)
    }
  }

  if (isSkeletonLoading) {
    return (
      <AdminDataPageSkeleton
        title="Rekap PHBS Kabupaten"
        description="Format rekap kabupaten mengikuti struktur dokumen PHS Kab untuk kebutuhan ekspor dan pelaporan berjenjang."
        icon={<Building2 size={22} />}
        tableColumnCount={12}
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
            <Building2 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Rekap PHBS Kabupaten</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rekap berjenjang kecamatan, puskesmas, dan desa/kelurahan yang mengikuti kebutuhan format PHS kabupaten.</p>
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
        <StatCard title="Kecamatan" value={formatNumber(stats.districts)} subtitle="Masuk pada hasil filter aktif" color="blue" icon={<Building2 size={22} />} />
        <StatCard title="Puskesmas" value={formatNumber(stats.puskesmas)} subtitle="Unit pelapor pada rekap" color="teal" icon={<Building2 size={22} />} />
        <StatCard title="Desa/Kelurahan" value={formatNumber(stats.villages)} subtitle="Baris rekap yang siap diekspor" color="emerald" icon={<Building2 size={22} />} />
        <StatCard title="Rerata Sehat" value={`${stats.avgHealthy}%`} subtitle={`Tidak sehat rata-rata ${stats.avgUnhealthy}%`} color="amber" icon={<Building2 size={22} />} />
      </div>



      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari kecamatan, puskesmas, atau desa/kelurahan..."
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
          description="Gunakan filter di bawah ini untuk melihat indikator pada rentang yang lebih spesifik."
          summary={`Menampilkan baris dari filter aktif.`}
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



        <div className="p-6 space-y-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-900/20">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-full bg-blue-100 p-2 dark:bg-blue-800">
                <Building2 size={20} className="text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">Informasi Perhitungan Tabel PHS Kabupaten</h3>
                <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                  Total individu/ART yang telah disurvei pada filter aktif ini adalah <strong>{formatNumber(stats.artTotal || 0)} ART</strong>. Tabel ini menampilkan akumulasi penduduk berdasarkan batasan umurnya masing-masing sesuai standar PHS Kabupaten:
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-blue-800 dark:text-blue-200">
                  <li><strong>Konsumsi Buah & Sayur:</strong> Dihitung dari ART yang berumur &ge; 5 tahun.</li>
                  <li><strong>Aktivitas Fisik, Cuci Tangan, Tidak Merokok:</strong> Dihitung dari ART yang berumur &ge; 10 tahun.</li>
                  <li><strong>Cek Tekanan Darah & Cek Gula Darah:</strong> Dihitung dari ART yang berumur &ge; 15 tahun.</li>
                  <li><strong>Sehat & Tidak Sehat:</strong> Menggambarkan jumlah individu yang berstatus sehat berdasarkan seluruh indikator yang relevan untuk umurnya.</li>
                </ul>
              </div>
            </div>
          </div>

          <DataTable
            headers={[
              'No', 'Kecamatan', 'Puskesmas', 'Desa / Kel',
              'Total ART Disurvei', 'ART ≥ 5 th', 'ART ≥ 10 th', 'ART ≥ 15 th',
              'Buah/Sayur Sehat (≥5 th)', 'Aktivitas Sehat (≥10 th)', 'Cuci Tangan Sehat (≥10 th)', 'Tidak Merokok Sehat (≥10 th)', 'Cek TD Sehat (≥15 th)', 'Cek Gula Sehat (≥15 th)',
              'Individu Sehat', '% Sehat', 'Individu Tidak Sehat', '% Tidak Sehat', 'Aksi'
            ]}
            pagination={meta}
            onPageChange={setPage}
            isLoading={isLoading}
            emptyState="Belum ada data rekap PHBS yang cocok dengan filter saat ini."
            minWidth="min-w-[2400px]"
          >
            {data.map((record, index) => {
              const rowNumber = meta ? (meta.page - 1) * meta.perPage + index + 1 : index + 1
              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-white">{rowNumber}</td>
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{record.districtName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.puskesmasName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.villageName}</td>
                  
                  <td className="px-6 py-4 text-sm text-center font-medium text-slate-800 dark:text-slate-200">{formatNumber(record.artTotal)}</td>
                  <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-300">{record.artTotal > 0 ? formatNumber(record.artAge5) : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-300">{record.artTotal > 0 ? formatNumber(record.artAge10) : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-300">{record.artTotal > 0 ? formatNumber(record.artAge15) : '-'}</td>
                  
                  <td className="px-6 py-4 text-sm text-center font-medium text-emerald-600 dark:text-emerald-400">{record.artTotal > 0 ? formatNumber(record.fruitVegetableHealthy) : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center font-medium text-emerald-600 dark:text-emerald-400">{record.artTotal > 0 ? formatNumber(record.physicalActivityHealthy) : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center font-medium text-emerald-600 dark:text-emerald-400">{record.artTotal > 0 ? formatNumber(record.handWashingHealthy) : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center font-medium text-emerald-600 dark:text-emerald-400">{record.artTotal > 0 ? formatNumber(record.noSmokingHealthy) : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center font-medium text-emerald-600 dark:text-emerald-400">{record.artTotal > 0 ? formatNumber(record.bloodPressureCheckHealthy) : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center font-medium text-emerald-600 dark:text-emerald-400">{record.artTotal > 0 ? formatNumber(record.bloodSugarCheckHealthy) : '-'}</td>
                  
                  <td className="px-6 py-4 text-sm text-center font-bold text-emerald-600 dark:text-emerald-400">{record.artTotal > 0 ? formatNumber(record.healthyIndividuals) : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center font-bold text-emerald-600 dark:text-emerald-400">{record.artTotal > 0 ? `${Math.round((record.healthyIndividuals / record.artTotal) * 100)}%` : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center font-bold text-rose-500 dark:text-rose-400">{record.artTotal > 0 ? formatNumber(record.unhealthyIndividuals) : '-'}</td>
                  <td className="px-6 py-4 text-sm text-center font-bold text-rose-500 dark:text-rose-400">{record.artTotal > 0 ? `${Math.round((record.unhealthyIndividuals / record.artTotal) * 100)}%` : '-'}</td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Detail Rekap PHBS Kabupaten" onClick={() => setSelectedRecord(record)} />
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
        title="Detail Rekap PHBS Kabupaten"
        description="Melihat komposisi ART dan capaian indikator utama pada baris rekap kabupaten."
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
              <InfoBlock label="Total ART" value={formatNumber(selectedRecord.artTotal)} tone="info" />
              <InfoBlock label="ART >= 5 Tahun" value={formatNumber(selectedRecord.artAge5)} />
              <InfoBlock label="ART >= 10 Tahun" value={formatNumber(selectedRecord.artAge10)} />
              <InfoBlock label="ART >= 15 Tahun" value={formatNumber(selectedRecord.artAge15)} />
              <InfoBlock label="Total Responden" value={formatNumber(selectedRecord.totalFamilies)} tone="info" />
              <InfoBlock label="Data Sehat" value={selectedRecord.totalFamilies > 0 ? `${formatNumber(selectedRecord.healthyFamilies)} (${selectedRecord.healthyPct}%)` : '-'} tone="success" />
              <InfoBlock label="Data Tidak Sehat" value={selectedRecord.totalFamilies > 0 ? `${formatNumber(selectedRecord.unhealthyFamilies)} (${selectedRecord.unhealthyPct}%)` : '-'} tone="warning" />
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
              <h4 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Capaian Indikator (Berdasarkan Total ART)</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoBlock label="Buah & Sayur" value={selectedRecord.artTotal > 0 ? `${selectedRecord.fruitVegetableTotalPct}%` : '-'} />
                <InfoBlock label="Aktivitas Fisik" value={selectedRecord.artTotal > 0 ? `${selectedRecord.physicalActivityTotalPct}%` : '-'} />
                <InfoBlock label="Cuci Tangan" value={selectedRecord.artTotal > 0 ? `${selectedRecord.handWashingTotalPct}%` : '-'} />
                <InfoBlock label="Tidak Merokok" value={selectedRecord.artTotal > 0 ? `${selectedRecord.noSmokingTotalPct}%` : '-'} />
                <InfoBlock label="Cek Tekanan Darah" value={selectedRecord.artTotal > 0 ? `${selectedRecord.bloodPressureCheckTotalPct}%` : '-'} />
                <InfoBlock label="Cek Gula Darah" value={selectedRecord.artTotal > 0 ? `${selectedRecord.bloodSugarCheckTotalPct}%` : '-'} />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}


