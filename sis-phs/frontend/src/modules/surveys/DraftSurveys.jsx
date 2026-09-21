import { useMemo, useState } from 'react'
import { ClipboardPenLine, Download, Eye, RefreshCcw, Trash2, UploadCloud } from 'lucide-react'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { exportRowsToExcel } from '../../utils/exportExcel'
import {
  getDraftStatusMeta,
  getDraftSurveyRecords,
  getOperationalOptions,
  getSyncStatusMeta,
} from '../../services/operationalData'
import { InfoBlock, SelectField, ToneBadge } from '../reports/reportComponents'

const defaultFilters = {
  districtId: '',
  villageId: '',
  draftStatus: '',
  syncStatus: '',
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function DraftSurveys() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [deleteRecord, setDeleteRecord] = useState(null)

  const options = getOperationalOptions({ districtId: filters.districtId })
  const { data, meta } = useMemo(() => getDraftSurveyRecords({
    page,
    perPage: 5,
    search,
    ...filters,
  }), [filters, page, search])
  const exportRows = useMemo(
    () => getDraftSurveyRecords({ page: 1, perPage: 999, search, ...filters }).data,
    [filters, search],
  )

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'districtId') {
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
      filename: 'draft-survei-kader',
      sheetName: 'Draft Survei',
      columns: ['ID Draft', 'ID Responden', 'Nama Responden', 'Alamat', 'Tahap', 'Progress', 'Status Draft', 'Status Sinkron', 'Update Terakhir'],
      rows: exportRows.map((row) => [
        row.id,
        row.householdNo,
        row.householdHead,
        row.address,
        row.surveyStep,
        `${row.completionPercent}%`,
        getDraftStatusMeta(row.draftStatus).label,
        getSyncStatusMeta(row.syncStatus).label,
        formatDateTime(row.lastUpdatedAt),
      ]),
    })
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Draft Survei"
        description="Kelola draft, sinkronisasi, dan kirim survei."
        icon={<ClipboardPenLine size={22} />}
        tableColumnCount={7}
        filterFieldCount={4}
        statCount={0}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <ClipboardPenLine size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Draft Survei</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Kelola draft dan status sinkronisasi.</p>
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
            Export Draft
          </button>
        </div>
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari ID responden, Nama Responden, alamat, atau tahap draft..."
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
          description="Gunakan filter untuk memisahkan draft siap submit, draft bermasalah saat sinkronisasi, atau draft yang masih harus dilanjutkan."
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
            options={[{ value: '', label: 'Semua Desa' }, ...options.villages.map((item) => ({ value: item.id, label: item.name }))]}
          />
          <SelectField
            label="Status Draft"
            value={filters.draftStatus}
            onChange={(value) => handleFilterChange('draftStatus', value)}
            options={[{ value: '', label: 'Semua Status Draft' }, ...options.draftStatuses]}
          />
          <SelectField
            label="Status Sinkronisasi"
            value={filters.syncStatus}
            onChange={(value) => handleFilterChange('syncStatus', value)}
            options={[{ value: '', label: 'Semua Status Sinkron' }, ...options.syncStatuses]}
          />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Update Terakhir', 'Responden', 'Tahap', 'Progress', 'Sinkron', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Belum ada draft yang cocok dengan pencarian atau filter aktif."
          >
            {data.map((record) => {
              const draftMeta = getDraftStatusMeta(record.draftStatus)
              const syncMeta = getSyncStatusMeta(record.syncStatus)

              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateTime(record.lastUpdatedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.householdHead}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{record.householdNo}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{record.address}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="font-medium text-slate-800 dark:text-white">{record.surveyStep}</div>
                    <div>{record.respondentCount} responden tercatat</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-800 dark:text-white">{record.completionPercent}%</div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${record.completionPercent}%` }} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${syncMeta.tone}`}>{syncMeta.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${draftMeta.tone}`}>{draftMeta.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Detail Draft" onClick={() => setSelectedRecord(record)} />
                      <TableActionButton icon={<UploadCloud size={16} />} label="Lanjutkan Draft" onClick={() => setSelectedRecord(record)} tone="primary" />
                      <TableActionButton icon={<Trash2 size={16} />} label="Hapus Draft" onClick={() => setDeleteRecord(record)} tone="danger" />
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
        title={selectedRecord ? `Ringkasan ${selectedRecord.householdHead}` : 'Ringkasan Draft'}
        description="Cek posisi input terakhir, status sinkronisasi, dan catatan yang perlu dituntaskan sebelum submit."
        footer={(
          <>
            <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Tutup
            </button>
            <button type="button" className="master-primary-btn px-4 py-2.5 text-sm font-medium">
              Lanjutkan Draft
            </button>
          </>
        )}
      >
        {selectedRecord ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBlock label="ID Responden" value={selectedRecord.householdNo} />
              <InfoBlock label="Nama Responden" value={selectedRecord.householdHead} />
              <InfoBlock label="Alamat" value={selectedRecord.address} />
              <InfoBlock label="Tahap Terakhir" value={selectedRecord.surveyStep} />
              <InfoBlock label="Progress" value={`${selectedRecord.completionPercent}%`} tone={selectedRecord.completionPercent >= 80 ? 'success' : 'warning'} />
              <InfoBlock label="Responden" value={`${selectedRecord.respondentCount} orang`} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Status Draft</div>
                <div className="mt-2"><ToneBadge tone={selectedRecord.draftStatus === 'READY_SUBMIT' ? 'success' : 'warning'}>{getDraftStatusMeta(selectedRecord.draftStatus).label}</ToneBadge></div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Status Sinkronisasi</div>
                <div className="mt-2"><ToneBadge tone={selectedRecord.syncStatus === 'SYNCED' ? 'success' : selectedRecord.syncStatus === 'CONFLICT' ? 'danger' : 'warning'}>{getSyncStatusMeta(selectedRecord.syncStatus).label}</ToneBadge></div>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {selectedRecord.flaggedNotes}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteRecord)}
        onClose={() => setDeleteRecord(null)}
        size="sm"
        title={deleteRecord ? `Hapus draft ${deleteRecord.id}` : 'Hapus Draft'}
        description="Aksi ini idealnya menghapus draft lokal dan payload sinkron tertunda. Pada fase UI/UX, modal ini menyiapkan alur konfirmasi final."
        footer={(
          <>
            <button type="button" onClick={() => setDeleteRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Batal
            </button>
            <button type="button" onClick={() => setDeleteRecord(null)} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700">
              <Trash2 size={16} />
              Ya, Hapus Draft
            </button>
          </>
        )}
      >
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Draft untuk <span className="font-semibold text-slate-800 dark:text-white">{deleteRecord?.householdHead}</span> akan dikeluarkan dari daftar aktif. Saat backend tersambung, aksi ini sebaiknya ikut mencatat audit log penghapusan draft.
        </p>
      </Modal>
    </div>
  )
}

