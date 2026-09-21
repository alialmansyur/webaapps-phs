import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, Download, Eye, PencilLine, Plus, Power, RefreshCcw } from 'lucide-react'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { exportRowsToExcel } from '../../utils/exportExcel'
import {
  getPeriodOptions,
  getPeriodStatusMeta,
  getPeriodTypeMeta,
} from '../../services/settingsAdminData'
import {
  createPeriod,
  fetchPeriodRecords,
  updatePeriod,
  updatePeriodStatus,
} from '../../services/liveAdminApi'
import { toast } from 'react-toastify'
import { getCurrentRole } from '../../services/auth'

const defaultFilters = {
  year: '',
  status: '',
  type: '',
  targetBand: '',
}

const emptyForm = {
  id: '',
  year: '2026',
  name: '',
  type: 'REGULAR',
  startDate: '',
  endDate: '',
  targetPercentage: '',
  note: '',
  status: 'DRAFT',
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDate(value) {
  if (!value) return '-'
  return dateFormatter.format(new Date(value))
}

function formatPeriodRange(startDate, endDate) {
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  if (startDate) return formatDate(startDate)
  if (endDate) return formatDate(endDate)

  return '-'
}

function formatDateTime(value) {
  return dateTimeFormatter.format(new Date(value))
}

export default function SystemSettings() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [periodRecords, setPeriodRecords] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [confirmPeriod, setConfirmPeriod] = useState(null)
  const [formMode, setFormMode] = useState('')
  const [formDraft, setFormDraft] = useState(emptyForm)
  const [meta, setMeta] = useState({ page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
  const [yearOptions, setYearOptions] = useState([])
  const isAdmin = getCurrentRole() === 'admin'

  const options = useMemo(() => ({
    ...getPeriodOptions(periodRecords),
    years: yearOptions.length > 0 ? yearOptions : getPeriodOptions(periodRecords).years,
  }), [periodRecords, yearOptions])
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)
  const showFormModal = formMode !== ''

  const loadPeriods = async ({ currentPage = page } = {}) => {
    const response = await fetchPeriodRecords({
      page: currentPage,
      per_page: 5,
      search,
      year: filters.year,
      status: filters.status,
      type: filters.type,
      target_band: filters.targetBand,
    })

    setPeriodRecords(response?.data || [])
    setMeta(response?.meta || { page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
    setYearOptions(response?.filters?.years || [])
  }

  useEffect(() => {
    let alive = true

    fetchPeriodRecords({
      page,
      per_page: 5,
      search,
      year: filters.year,
      status: filters.status,
      type: filters.type,
      target_band: filters.targetBand,
    }).then((response) => {
      if (!alive) return
      setPeriodRecords(response?.data || [])
      setMeta(response?.meta || { page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
      setYearOptions(response?.filters?.years || [])
    }).catch(() => {})

    return () => {
      alive = false
    }
  }, [filters.status, filters.targetBand, filters.type, filters.year, page, search])

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const handleReset = () => {
    setSearch('')
    setFilters(defaultFilters)
    setPage(1)
  }

  const handleExport = async () => {
    const response = await fetchPeriodRecords({
      page: 1,
      per_page: 100,
      search,
      year: filters.year,
      status: filters.status,
      type: filters.type,
      target_band: filters.targetBand,
    })

    const rows = response?.data || []

    exportRowsToExcel({
      filename: 'settings-periode-target-tahunan',
      sheetName: 'Periode Tahunan',
      columns: ['Tahun', 'Periode', 'Jenis', 'Tanggal Periode', 'Target', 'Status', 'Last Updated'],
      rows: rows.map((item) => ([
        item.year,
        item.name,
        getPeriodTypeMeta(item.type).label,
        formatPeriodRange(item.startDate, item.endDate),
        `${item.targetPercentage}%`,
        getPeriodStatusMeta(item.status).label,
        formatDateTime(item.updatedAt),
      ])),
    })
  }

  const openCreateModal = () => {
    setFormMode('create')
    setFormDraft(emptyForm)
  }

  const openEditModal = (record) => {
    setFormMode('edit')
    setFormDraft({
      id: record.id,
      year: String(record.year),
      name: record.name,
      type: record.type,
      startDate: record.startDate || '',
      endDate: record.endDate || '',
      targetPercentage: String(record.targetPercentage),
      note: record.note,
      status: record.status,
    })
  }

  const closeFormModal = () => {
    setFormMode('')
    setFormDraft(emptyForm)
  }

  const handleSaveForm = async () => {
    if (!formDraft.year || !formDraft.name || !formDraft.targetPercentage) {
      return
    }

    const payload = {
      year: Number(formDraft.year),
      name: formDraft.name,
      type: formDraft.type,
      start_date: formDraft.startDate || null,
      end_date: formDraft.endDate || null,
      targetPercentage: Number(formDraft.targetPercentage),
      target_percentage: Number(formDraft.targetPercentage),
      note: formDraft.note,
      status: formDraft.status,
    }

    try {
      if (formMode === 'edit') {
        await updatePeriod(formDraft.id, payload)
      } else {
        await createPeriod(payload)
      }

      await loadPeriods({ currentPage: 1 })
      setPage(1)
      toast.success(formMode === 'edit' ? 'Periode berhasil diperbarui.' : 'Periode berhasil dibuat.')
      closeFormModal()
    } catch (error) {
      toast.error(error?.message || 'Gagal menyimpan periode.')
    }
  }

  const handleTogglePeriodStatus = async () => {
    if (!confirmPeriod) return

    const nextStatus = confirmPeriod.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE'

    try {
      await updatePeriodStatus(confirmPeriod.id, nextStatus)
      await loadPeriods()
      toast.success('Status periode berhasil diperbarui.')
      setConfirmPeriod(null)
    } catch (error) {
      toast.error(error?.message || 'Gagal memperbarui status periode.')
    }
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Periode & Target Tahunan"
        description="Pengelolaan periode aktif, target tahunan, dan kesiapan operasional survei."
        icon={<CalendarRange size={22} />}
        tableColumnCount={8}
        filterFieldCount={4}
        actionCount={3}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <CalendarRange size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Periode &amp; Target Tahunan</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Kelola pembukaan periode survey, target persentase, dan status operasional.</p>
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
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download size={16} />
            Export Data
          </button>
          {isAdmin && (
            <button type="button" onClick={openCreateModal} className="master-primary-btn px-4 py-3 text-sm font-semibold">
              <Plus size={16} />
              Tambah Periode
            </button>
          )}
        </div>
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari nama periode, catatan admin, atau user terakhir update..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        >
          <select
            value={filters.year}
            onChange={(event) => handleFilterChange('year', event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Semua Tahun</option>
            {options.years.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button type="button" onClick={handleExport} className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <Download size={14} className="mr-2 inline" />
            Export Data
          </button>
        </FilterBar>

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Saring periode berdasarkan tahun, status operasional, atau tipe pelaksanaan agar review admin lebih cepat."
          summary={activeFilterCount > 0 ? `Pencarian aktif pada ${activeFilterCount} parameter.` : 'Gunakan filter untuk memfokuskan periode yang sedang dikelola.'}
          columns={4}
        >
          <SelectField
            label="Tahun"
            value={filters.year}
            onChange={(value) => handleFilterChange('year', value)}
            options={[{ value: '', label: 'Semua Tahun' }, ...options.years]}
          />
          <SelectField
            label="Status Periode"
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={[{ value: '', label: 'Semua Status' }, ...options.statuses]}
          />
          <SelectField
            label="Tipe Periode"
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
            options={[{ value: '', label: 'Semua Tipe' }, ...options.types]}
          />
          <SelectField
            label="Target Operasional"
            value={filters.targetBand}
            onChange={(value) => handleFilterChange('targetBand', value)}
            options={[{ value: '', label: 'Semua Target' }, ...options.targetBands]}
          />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Tahun', 'Periode', 'Tanggal Periode', 'Target Persentase', 'Status', 'Last Updated', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Belum ada periode yang sesuai dengan filter saat ini."
          >
            {periodRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Belum ada periode yang sesuai dengan filter saat ini.
                </td>
              </tr>
            ) : periodRecords.map((record) => {
              const statusMeta = getPeriodStatusMeta(record.status)
              const typeMeta = getPeriodTypeMeta(record.type)

              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{record.year}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.name}</div>
                    <div className="mt-2">
                      <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${typeMeta.tone}`}>{typeMeta.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatPeriodRange(record.startDate, record.endDate)}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.targetPercentage}%</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Persentase target operasional</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${statusMeta.tone}`}>{statusMeta.label}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>{formatDateTime(record.updatedAt)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Detail Periode" onClick={() => setSelectedPeriod(record)} />
                      {isAdmin && (
                        <>
                          <TableActionButton icon={<PencilLine size={16} />} label="Edit Periode" onClick={() => openEditModal(record)} tone="primary" />
                          <TableActionButton icon={<Power size={16} />} label={record.status === 'ACTIVE' ? 'Tutup Periode' : 'Buka Periode'} onClick={() => setConfirmPeriod(record)} tone={record.status === 'ACTIVE' ? 'warning' : 'success'} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        </div>
      </div>

      <Modal
        open={Boolean(selectedPeriod)}
        onClose={() => setSelectedPeriod(null)}
        title={selectedPeriod ? `Detail ${selectedPeriod.name}` : 'Detail Periode'}
        description="Ringkasan target, jadwal, status operasional, dan catatan admin untuk periode terpilih."
        footer={<button type="button" onClick={() => setSelectedPeriod(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Tutup</button>}
      >
        {selectedPeriod ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBlock label="ID Periode" value={selectedPeriod.id} />
              <InfoBlock label="Tahun" value={String(selectedPeriod.year)} />
              <InfoBlock label="Nama Periode" value={selectedPeriod.name} />
              <InfoBlock label="Jenis Periode" value={getPeriodTypeMeta(selectedPeriod.type).label} />
              <InfoBlock label="Tanggal Mulai" value={formatDate(selectedPeriod.startDate)} />
              <InfoBlock label="Tanggal Selesai" value={formatDate(selectedPeriod.endDate)} />
              <InfoBlock label="Target Persentase" value={`${selectedPeriod.targetPercentage}%`} />
              <InfoBlock label="Status" value={getPeriodStatusMeta(selectedPeriod.status).label} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Catatan Admin</div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedPeriod.note}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showFormModal}
        onClose={closeFormModal}
        title={formMode === 'edit' ? 'Edit Periode' : 'Tambah Periode'}
        description="Gunakan form ini untuk mengatur jadwal, target persentase, dan status operasional periode survey."
        footer={(
          <>
            <button type="button" onClick={closeFormModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Batal</button>
            <button type="button" onClick={handleSaveForm} className="master-primary-btn px-4 py-2.5 text-sm font-medium">Simpan Periode</button>
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="Tahun" value={formDraft.year} onChange={(value) => setFormDraft((current) => ({ ...current, year: value }))} placeholder="2026" />
          <InputField label="Nama Periode" value={formDraft.name} onChange={(value) => setFormDraft((current) => ({ ...current, name: value }))} placeholder="Periode Pendataan Semester 1" />
          <SelectField label="Jenis Periode" value={formDraft.type} onChange={(value) => setFormDraft((current) => ({ ...current, type: value }))} options={options.types} />
          <SelectField label="Status Aktif" value={formDraft.status} onChange={(value) => setFormDraft((current) => ({ ...current, status: value }))} options={options.statuses} />
          <InputField label="Tanggal Mulai" type="date" value={formDraft.startDate} onChange={(value) => setFormDraft((current) => ({ ...current, startDate: value }))} />
          <InputField label="Tanggal Selesai" type="date" value={formDraft.endDate} onChange={(value) => setFormDraft((current) => ({ ...current, endDate: value }))} />
          <InputField label="Target Persentase" type="number" value={formDraft.targetPercentage} onChange={(value) => setFormDraft((current) => ({ ...current, targetPercentage: value }))} placeholder="82" min="0" max="100" />
          <div className="md:col-span-2">
            <TextareaField label="Keterangan / Catatan Admin" value={formDraft.note} onChange={(value) => setFormDraft((current) => ({ ...current, note: value }))} placeholder="Tambahkan catatan operasional periode..." />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmPeriod)}
        onClose={() => setConfirmPeriod(null)}
        size="sm"
        title={confirmPeriod?.status === 'ACTIVE' ? 'Tutup Periode?' : 'Buka Periode?'}
        description="Perubahan status periode tidak dijalankan langsung agar admin bisa memastikan dampaknya ke operasional lapangan."
        footer={(
          <>
            <button type="button" onClick={() => setConfirmPeriod(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Batal</button>
            <button type="button" onClick={handleTogglePeriodStatus} className="master-primary-btn px-4 py-2.5 text-sm font-medium">{confirmPeriod?.status === 'ACTIVE' ? 'Ya, Tutup Periode' : 'Ya, Buka Periode'}</button>
          </>
        )}
      >
        {confirmPeriod ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="font-semibold text-slate-800 dark:text-white">{confirmPeriod.name}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{confirmPeriod.year} · target {confirmPeriod.targetPercentage}%</div>
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {confirmPeriod.status === 'ACTIVE'
                ? 'Setelah ditutup, periode tidak lagi dianggap periode operasional utama dan hanya dipakai untuk audit serta rekap historis.'
                : 'Membuka periode akan menjadikannya periode aktif yang mudah terlihat oleh admin saat memantau kesiapan pendataan.'}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">{value}</div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type = 'text', min, max }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <input
        autoComplete="off"
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </label>
  )
}

function TextareaField({ label, value, onChange, placeholder }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
