import { useMemo, useState } from 'react'
import { Database, Download, Eye, FileUp, FolderSearch2, Plus, RefreshCcw } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import {
  getHouseholdStatusMeta,
  getSurveyDatabaseOptions,
  getSurveyDatabaseRecords,
  getSurveyDatabaseStats,
} from '../../services/adminData'

const defaultFilters = {
  districtId: '',
  villageId: '',
  puskesmasId: '',
  healthStatus: '',
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function SurveyDatabase() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedHousehold, setSelectedHousehold] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const options = getSurveyDatabaseOptions()

  const { data, meta } = useMemo(() => getSurveyDatabaseRecords({
    page,
    perPage: 5,
    search,
    districtId: filters.districtId,
    villageId: filters.villageId,
    puskesmasId: filters.puskesmasId,
    healthStatus: filters.healthStatus,
  }), [filters.districtId, filters.healthStatus, filters.puskesmasId, filters.villageId, page, search])

  const stats = useMemo(() => getSurveyDatabaseStats(), [])

  const villageOptions = useMemo(() => (
    filters.districtId
      ? options.villages.filter((item) => item.districtId === filters.districtId)
      : options.villages
  ), [filters.districtId, options.villages])

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'districtId') {
        next.villageId = ''
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

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Database Survei"
        description="Master data survei hasil survei."
        icon={<Database size={22} />}
        tableColumnCount={8}
        filterFieldCount={4}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 rounded-2xl">
            <Database size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Database Survei</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Master data survei hasil survei.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              handleReset()
              triggerSkeleton()
            }}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCcw size={16} />
            Refresh Filter
          </button>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileUp size={16} />
            Import KK
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition-colors"
          >
            <Download size={16} />
            Export Database
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Survei" value={String(stats.totalHouseholds)} subtitle="Keluarga terdaftar pada database" color="blue" icon={<Database size={22} />} />
        <StatCard title="Status Sehat" value={String(stats.healthyCount)} subtitle="IKS Data Sehat" color="emerald" icon={<FolderSearch2 size={22} />} />
        <StatCard title="Perlu Tindak Lanjut" value={String(stats.followUpCount)} subtitle="Pra-sehat dan tidak sehat" color="amber" icon={<Plus size={22} />} />
        <StatCard title="Rata-rata Anggota" value={String(stats.averageRespondents)} subtitle="Responden per keluarga" color="teal" icon={<Database size={22} />} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari ID responden, Nama Responden, desa, puskesmas..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        >
          <select
            value={filters.healthStatus}
            onChange={(event) => handleFilterChange('healthStatus', event.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:text-white"
          >
            <option value="">Semua Status</option>
            {options.statuses.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </FilterBar>

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Saring Database Survei berdasarkan wilayah, Puskesmas, dan status kesehatan keluarga."
          columns={4}
        >
          <SelectField
            label="Kecamatan"
            value={filters.districtId}
            onChange={(value) => handleFilterChange('districtId', value)}
            options={[{ value: '', label: 'Semua Kecamatan' }, ...options.districts.map((item) => ({ value: item.id, label: item.name }))]}
          />
          <SelectField
            label="Desa"
            value={filters.villageId}
            onChange={(value) => handleFilterChange('villageId', value)}
            options={[{ value: '', label: 'Semua Desa' }, ...villageOptions.map((item) => ({ value: item.id, label: item.name }))]}
          />
          <SelectField
            label="Puskesmas"
            value={filters.puskesmasId}
            onChange={(value) => handleFilterChange('puskesmasId', value)}
            options={[
              { value: '', label: 'Semua Puskesmas' },
              ...options.puskesmas
                .filter((item) => (filters.districtId ? item.districtId === filters.districtId : true))
                .map((item) => ({ value: String(item.id), label: item.name })),
            ]}
          />
          <SelectField
            label="Status Kesehatan"
            value={filters.healthStatus}
            onChange={(value) => handleFilterChange('healthStatus', value)}
            options={[{ value: '', label: 'Semua Status' }, ...options.statuses]}
          />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['ID Responden', 'Nama Responden', 'Wilayah', 'Puskesmas', 'Anggota', 'IKS', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Tidak ada responden yang cocok dengan filter saat ini."
          >
            {data.map((record) => {
              const statusMeta = getHouseholdStatusMeta(record.healthStatus)

              return (
                <tr key={record.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm text-slate-800 dark:text-white">{record.noKk}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Update {formatDate(record.latestSurveyDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.headOfFamilyName}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">RT {record.rt} / RW {record.rw}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>{record.districtName}</div>
                    <div className="text-slate-500 dark:text-slate-400">{record.villageName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.puskesmasName}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{record.respondentCount} orang</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-xl px-3 py-1.5 text-sm font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                      {record.latestIksScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${statusMeta.tone}`}>{statusMeta.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Lihat Detail" onClick={() => setSelectedHousehold(record)} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        </div>
      </div>

      <Modal
        open={Boolean(selectedHousehold)}
        onClose={() => setSelectedHousehold(null)}
        title={selectedHousehold ? `Detail Responden ${selectedHousehold.headOfFamilyName}` : 'Detail Responden'}
        description="Ringkasan responden, lokasi, hasil survei terakhir, dan kebutuhan intervensi."
        footer={(
          <button
            type="button"
            onClick={() => setSelectedHousehold(null)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Tutup
          </button>
        )}
      >
        {selectedHousehold ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBlock label="ID Responden" value={selectedHousehold.noKk} />
              <InfoBlock label="Nama Responden" value={selectedHousehold.headOfFamilyName} />
              <InfoBlock label="Wilayah" value={`${selectedHousehold.districtName} / ${selectedHousehold.villageName}`} />
              <InfoBlock label="Puskesmas" value={selectedHousehold.puskesmasName} />
              <InfoBlock label="Anggota Terdeteksi" value={`${selectedHousehold.respondentCount} orang`} />
              <InfoBlock label="Status Intervensi" value={selectedHousehold.interventionStatus} />
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/40">
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">Catatan Baseline API</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Saat backend aktif, detail ini idealnya menggabungkan `m_households`, `m_respondents`, `t_surveys`, dan status intervensi terakhir agar admin bisa audit satu keluarga dalam satu tempat.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Database Survei"
        description="Upload template Excel/CSV untuk registrasi KK massal dari Puskesmas atau hasil pendataan awal."
        size="sm"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors"
            >
              Simulasikan Import
            </button>
          </>
        )}
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-5 text-center bg-slate-50 dark:bg-slate-900">
            Drag & drop file `xlsx` / `csv` di sini
          </div>
          <ul className="space-y-2">
            <li>Kolom minimum: `no_kk`, `head_of_family_name`, `village_id`, `rt`, `rw`.</li>
            <li>Validasi duplicate KK dan referensi wilayah akan diproses di backend saat endpoint import tersedia.</li>
          </ul>
        </div>
      </Modal>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800 dark:text-white">{value}</div>
    </div>
  )
}


