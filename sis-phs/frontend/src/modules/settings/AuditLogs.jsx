import { useMemo, useState } from 'react'
import { Activity, Download, Eye, RefreshCcw, ShieldAlert } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { exportRowsToExcel } from '../../utils/exportExcel'
import {
  createInitialSettingsAdminState,
  getActivityTypeLabel,
  getAuditOptions,
  getAuditRecords,
  getAuditStats,
  getAuditStatusMeta,
} from '../../services/settingsAdminData'

const defaultFilters = {
  datePreset: 'ALL',
  role: '',
  module: '',
  actionType: '',
}

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDateTime(value) {
  return dateTimeFormatter.format(new Date(value))
}

export default function AuditLogs() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const initialState = useMemo(() => createInitialSettingsAdminState(), [])
  const [auditRecords] = useState(initialState.audits)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedAudit, setSelectedAudit] = useState(null)

  const options = useMemo(() => getAuditOptions(auditRecords), [auditRecords])
  const { data, meta } = useMemo(() => getAuditRecords({
    records: auditRecords,
    page,
    perPage: 6,
    search,
    datePreset: filters.datePreset,
    role: filters.role,
    module: filters.module,
    actionType: filters.actionType,
  }), [auditRecords, filters.actionType, filters.datePreset, filters.module, filters.role, page, search])
  const stats = useMemo(() => getAuditStats(auditRecords), [auditRecords])
  const activeFilterCount = Object.values(filters).filter((value) => value && value !== 'ALL').length + (search ? 1 : 0)

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const handleReset = () => {
    setSearch('')
    setFilters(defaultFilters)
    setPage(1)
  }

  const handleExport = () => {
    const rows = getAuditRecords({
      records: auditRecords,
      page: 1,
      perPage: auditRecords.length || 1,
      search,
      datePreset: filters.datePreset,
      role: filters.role,
      module: filters.module,
      actionType: filters.actionType,
    }).data

    exportRowsToExcel({
      filename: 'settings-audit-trail',
      sheetName: 'Audit Trail',
      columns: ['Waktu', 'User', 'Role', 'Modul', 'Aktivitas', 'Objek', 'IP Address', 'Status'],
      rows: rows.map((item) => ([
        formatDateTime(item.timestamp),
        item.userName,
        item.role,
        item.module,
        item.actionLabel,
        item.entityLabel,
        item.ipAddress,
        getAuditStatusMeta(item.status).label,
      ])),
    })
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Audit Trail"
        description="Pemantauan aktivitas dan perubahan penting dalam sistem admin."
        icon={<ShieldAlert size={22} />}
        tableColumnCount={9}
        filterFieldCount={4}
        statCount={4}
        actionCount={2}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Audit Trail</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Jejak aktivitas login, approval, perubahan data, export, dan perubahan akses penting dalam sistem.</p>
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
            Export Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Aktivitas" value={String(stats.total)} subtitle="Semua event audit tersimpan" color="blue" icon={<Activity size={22} />} />
        <StatCard title="Login Hari Ini" value={String(stats.loginToday)} subtitle="Aktivitas autentikasi yang tercatat hari ini" color="emerald" icon={<ShieldAlert size={22} />} />
        <StatCard title="Perubahan Data" value={String(stats.dataChanges)} subtitle="Create, approval, periode, dan RBAC" color="teal" icon={<Activity size={22} />} />
        <StatCard title="Aktivitas Sensitif" value={String(stats.sensitive)} subtitle="Export dan perubahan akses yang perlu dipantau" color="amber" icon={<ShieldAlert size={22} />} />
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari user, aktivitas, objek, atau IP address..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        >
          <select value={filters.datePreset} onChange={(event) => handleFilterChange('datePreset', event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            {options.datePresets.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button type="button" onClick={handleExport} className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <Download size={14} className="mr-2 inline" />
            Export Log
          </button>
        </FilterBar>

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Filter dipakai untuk meninjau aktivitas penting per role, modul, periode waktu, dan tipe tindakan."
          summary={activeFilterCount > 0 ? `Review audit aktif pada ${activeFilterCount} parameter.` : 'Mulai dengan filter tanggal atau role untuk mempersempit jejak aktivitas.'}
        >
          <SelectField label="Tanggal" value={filters.datePreset} onChange={(value) => handleFilterChange('datePreset', value)} options={options.datePresets} />
          <SelectField label="Role" value={filters.role} onChange={(value) => handleFilterChange('role', value)} options={[{ value: '', label: 'Semua Role' }, ...options.roles]} />
          <SelectField label="Modul" value={filters.module} onChange={(value) => handleFilterChange('module', value)} options={[{ value: '', label: 'Semua Modul' }, ...options.modules]} />
          <SelectField label="Tipe Aktivitas" value={filters.actionType} onChange={(value) => handleFilterChange('actionType', value)} options={[{ value: '', label: 'Semua Aktivitas' }, ...options.activityTypes]} />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Waktu', 'User', 'Role', 'Modul', 'Aktivitas', 'Objek / Entitas', 'IP Address', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Belum ada aktivitas audit yang cocok dengan filter saat ini."
          >
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Belum ada aktivitas audit yang cocok dengan filter saat ini.
                </td>
              </tr>
            ) : data.map((record) => {
              const statusMeta = getAuditStatusMeta(record.status)

              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDateTime(record.timestamp)}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.userName}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{record.device}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.role}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.module}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.actionLabel}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{getActivityTypeLabel(record.actionType)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.entityLabel}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{record.entityName}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{record.ipAddress}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${statusMeta.tone}`}>{statusMeta.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => setSelectedAudit(record)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                      <Eye size={14} />
                      Detail
                    </button>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        </div>
      </div>

      <Modal
        open={Boolean(selectedAudit)}
        onClose={() => setSelectedAudit(null)}
        title={selectedAudit ? `Detail Audit ${selectedAudit.id}` : 'Detail Audit'}
        description="Informasi lengkap event audit, metadata teknis, serta preview perubahan nilai lama dan baru."
        size="xl"
        footer={<button type="button" onClick={() => setSelectedAudit(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Tutup</button>}
      >
        {selectedAudit ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoBlock label="Timestamp" value={formatDateTime(selectedAudit.timestamp)} />
              <InfoBlock label="Nama User" value={selectedAudit.userName} />
              <InfoBlock label="Role User" value={selectedAudit.role} />
              <InfoBlock label="Route / Modul" value={`${selectedAudit.route} · ${selectedAudit.module}`} />
              <InfoBlock label="Action Type" value={getActivityTypeLabel(selectedAudit.actionType)} />
              <InfoBlock label="Status" value={getAuditStatusMeta(selectedAudit.status).label} />
              <InfoBlock label="Target Entity" value={selectedAudit.entityLabel} />
              <InfoBlock label="IP Address" value={selectedAudit.ipAddress} />
              <InfoBlock label="Device / Browser" value={selectedAudit.device} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Catatan Korelasi</div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedAudit.note}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PreviewBlock title="Old Value" value={selectedAudit.oldValue} />
              <PreviewBlock title="New Value" value={selectedAudit.newValue} />
            </div>
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

function PreviewBlock({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 dark:border-slate-700">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</div>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-sm leading-6 text-slate-100">{value}</pre>
    </div>
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
