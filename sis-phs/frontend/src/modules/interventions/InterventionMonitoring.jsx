import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Download, Eye, RefreshCcw, UserRoundPlus, Plus, Edit, Trash2 } from 'lucide-react'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { exportRowsToExcel } from '../../utils/exportExcel'
import {
  getInterventionStatusMeta,
  getOperationalOptions,
  getPriorityMeta,
} from '../../services/operationalData'
import { InfoBlock, SelectField, ToneBadge } from '../reports/reportComponents'
import { toast } from 'react-toastify'
import {
  getAdminInterventions,
  createAdminIntervention,
  updateAdminIntervention,
  deleteAdminIntervention
} from '../../services/adminInterventions'

const defaultFilters = {
  districtId: '',
  puskesmasId: '',
  villageId: '',
  kaderId: '',
  status: '',
  priority: '',
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function InterventionMonitoring() {
  const { isLoading: isPageLoading, triggerSkeleton } = useAdminPageSkeleton()
  
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, perPage: 5, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  
  const [selectedRecord, setSelectedRecord] = useState(null)
  
  // Modals state
  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState('add') // 'add' | 'edit' | 'assign'
  const [formData, setFormData] = useState({ id: null, survey_id: '', kader_id: '', topic: '', result: '', follow_up: '', next_visit_at: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)

  const [deleteRecord, setDeleteRecord] = useState(null)

  const options = getOperationalOptions({
    districtId: filters.districtId,
    puskesmasId: filters.puskesmasId,
  })

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const fetchInterventions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getAdminInterventions({ page, perPage: 5, search, ...filters })
      setData(response.data || [])
      setMeta({
        page: response.current_page || 1,
        perPage: response.per_page || 5,
        total: response.total || 0,
        totalPages: response.last_page || 1,
        from: response.from || 0,
        to: response.to || 0
      })
    } catch (err) {
      setError(err.message || 'Gagal memuat data intervensi.')
    } finally {
      setLoading(false)
    }
  }, [page, search, filters])

  useEffect(() => {
    fetchInterventions()
  }, [fetchInterventions])

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'districtId') {
        next.puskesmasId = ''
        next.villageId = ''
        next.kaderId = ''
      }
      if (key === 'puskesmasId') {
        next.villageId = ''
        next.kaderId = ''
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

  const handleExport = async () => {
    try {
      const response = await getAdminInterventions({ page: 1, perPage: 9999, search, ...filters })
      const exportRows = response.data || []
      
      exportRowsToExcel({
        filename: 'monitoring-intervensi',
        sheetName: 'Monitoring Intervensi',
        columns: ['ID', 'Responden', 'Kecamatan', 'Desa', 'Puskesmas', 'Kader', 'Isu Utama', 'Prioritas', 'Status', 'Next Visit'],
        rows: exportRows.map((row) => [
          row.id,
          row.householdHead,
          row.districtName,
          row.villageName,
          row.puskesmasName,
          row.kaderName,
          row.issueSummary,
          getPriorityMeta(row.priority).label,
          getInterventionStatusMeta(row.status).label,
          formatDateTime(row.nextVisitAt),
        ]),
      })
    } catch (err) {
      toast.error('Gagal mengekspor data: ' + err.message)
    }
  }

  const openForm = (mode, record = null) => {
    setFormMode(mode)
    setFormError(null)
    if (record && (mode === 'edit' || mode === 'assign')) {
      setFormData({
        id: record.id,
        survey_id: record.surveyId || '',
        kader_id: record.kaderId || '',
        topic: record.issueSummary || '',
        result: record.notes || '',
        follow_up: record.followUp || '',
        next_visit_at: record.nextVisitAt ? record.nextVisitAt.substring(0, 16) : ''
      })
    } else {
      setFormData({ id: null, survey_id: '', kader_id: '', topic: '', result: '', follow_up: '', next_visit_at: '' })
    }
    setShowFormModal(true)
  }

  const handleSaveForm = async () => {
    setFormLoading(true)
    setFormError(null)
    try {
      if (formMode === 'add') {
        await createAdminIntervention(formData)
      } else {
        await updateAdminIntervention(formData.id, formData)
      }
      setShowFormModal(false)
      fetchInterventions()
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteRecord) return
    setFormLoading(true)
    try {
      await deleteAdminIntervention(deleteRecord.id)
      setDeleteRecord(null)
      fetchInterventions()
    } catch (err) {
      toast.error('Gagal menghapus: ' + err.message)
    } finally {
      setFormLoading(false)
    }
  }

  if (isPageLoading) {
    return (
      <AdminDataPageSkeleton
        title="Monitoring Intervensi"
        description="Pantau target, progres, dan tindak lanjut."
        icon={<ClipboardList size={22} />}
        tableColumnCount={8}
        filterFieldCount={6}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Monitoring Intervensi</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pantau target dan progres intervensi.</p>
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
          <button type="button" onClick={handleExport} className="master-primary-btn px-4 py-3 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
            <Download size={16} />
            Export Monitoring
          </button>
          <button type="button" onClick={() => openForm('add')} className="master-primary-btn px-4 py-3 text-sm font-semibold">
            <Plus size={16} />
            Tambah Intervensi
          </button>
        </div>
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari responden, ID responden, isu utama..."
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
          description="Filter ini memudahkan admin memisahkan area dengan backlog intervensi, Prioritas Intervensi, atau distribusi beban kader."
        >
          <SelectField label="Kecamatan" value={filters.districtId} onChange={(value) => handleFilterChange('districtId', value)} options={[{ value: '', label: 'Semua Kecamatan' }, ...options.districts.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Puskesmas" value={filters.puskesmasId} onChange={(value) => handleFilterChange('puskesmasId', value)} options={[{ value: '', label: 'Semua Puskesmas' }, ...options.puskesmas.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Desa" value={filters.villageId} onChange={(value) => handleFilterChange('villageId', value)} options={[{ value: '', label: 'Semua Desa' }, ...options.villages.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Kader" value={filters.kaderId} onChange={(value) => handleFilterChange('kaderId', value)} options={[{ value: '', label: 'Semua Kader' }, ...options.kaders.map((item) => ({ value: item.id, label: item.name }))]} />
        </FilterPanel>

        <div className="p-6 relative min-h-[300px]">
          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-slate-900/50">
              <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl dark:bg-rose-900/20 dark:text-rose-400">
              {error}
            </div>
          ) : (
            <DataTable
              headers={['Jadwal', 'Responden Sasaran', 'Wilayah', 'Kader', 'Masalah', 'Prioritas', 'Status', 'Aksi']}
              pagination={meta}
              onPageChange={setPage}
              emptyState="Belum ada target intervensi yang cocok dengan filter aktif."
            >
              {data.map((record) => {
                const statusMeta = getInterventionStatusMeta(record.status)
                const priority = getPriorityMeta(record.priority)

                return (
                  <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      <div>{formatDateTime(record.nextVisitAt)}</div>
                      <div className="mt-1 text-xs">Last action {formatDateTime(record.lastActionAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-white">{record.householdHead}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{record.householdNo}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      <div>{record.districtName}</div>
                      <div className="text-slate-500 dark:text-slate-400">{record.villageName}</div>
                      <div className="text-slate-500 dark:text-slate-400">{record.puskesmasName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.kaderName}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-white">{record.issueSummary}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{record.progressLabel}</div>
                    </td>
                    <td className="px-6 py-4"><ToneBadge tone={priority.tone}>{priority.label}</ToneBadge></td>
                    <td className="px-6 py-4"><span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${statusMeta.tone}`}>{statusMeta.label}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <TableActionButton icon={<Eye size={16} />} label="Detail" onClick={() => setSelectedRecord(record)} />
                        <TableActionButton icon={<UserRoundPlus size={16} />} label="Assign Kader" onClick={() => openForm('assign', record)} tone="primary" />
                        <TableActionButton icon={<Edit size={16} />} label="Edit" onClick={() => openForm('edit', record)} tone="warning" />
                        <TableActionButton icon={<Trash2 size={16} />} label="Hapus" onClick={() => setDeleteRecord(record)} tone="danger" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </DataTable>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Timeline ${selectedRecord.householdHead}` : 'Timeline Intervensi'}
        description="Ringkasan konteks responden, isu utama, dan progres sesi agar reviewer bisa mengambil keputusan cepat."
        footer={(
          <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Tutup
          </button>
        )}
      >
        {selectedRecord && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBlock label="Responden Sasaran" value={selectedRecord.householdHead} />
              <InfoBlock label="Kader" value={selectedRecord.kaderName} />
              <InfoBlock label="Wilayah" value={`${selectedRecord.districtName} / ${selectedRecord.villageName}`} />
              <InfoBlock label="Puskesmas" value={selectedRecord.puskesmasName} />
              <InfoBlock label="Target Visit Berikutnya" value={formatDateTime(selectedRecord.nextVisitAt)} tone={selectedRecord.status === 'OVERDUE' ? 'danger' : 'info'} />
              <InfoBlock label="Progress" value={selectedRecord.progressLabel} />
            </div>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <div className="font-semibold text-slate-800 dark:text-white">Isu Utama</div>
              <div className="mt-1">{selectedRecord.issueSummary}</div>
              <div className="mt-3 font-semibold text-slate-800 dark:text-white">Hasil Intervensi / Catatan</div>
              <div className="mt-1">{selectedRecord.notes}</div>
              <div className="mt-3 font-semibold text-slate-800 dark:text-white">Tindak Lanjut</div>
              <div className="mt-1">{selectedRecord.followUp}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        size="md"
        title={formMode === 'add' ? 'Tambah Intervensi' : formMode === 'edit' ? 'Edit Intervensi' : 'Assign Kader'}
        description={formMode === 'assign' ? 'Ubah penugasan kader untuk intervensi ini.' : 'Isi form di bawah ini untuk mengelola data intervensi.'}
        footer={(
          <>
            <button type="button" onClick={() => setShowFormModal(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Batal
            </button>
            <button type="button" onClick={handleSaveForm} disabled={formLoading} className="master-primary-btn px-4 py-2.5 text-sm font-medium">
              {formLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-rose-700 bg-rose-50 rounded-lg dark:bg-rose-900/20 dark:text-rose-400">
              {formError}
            </div>
          )}
          
          {formMode === 'add' && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Survey ID (Wajib)</label>
              <input
                autoComplete="off"
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={formData.survey_id}
                onChange={(e) => setFormData({ ...formData, survey_id: e.target.value })}
                placeholder="Masukkan ID Survey"
              />
            </div>
          )}

          <SelectField
            label="Kader Penanggung Jawab"
            value={formData.kader_id}
            onChange={(val) => setFormData({ ...formData, kader_id: val })}
            options={[{ value: '', label: 'Pilih Kader' }, ...options.kaders.map((item) => ({ value: item.id, label: item.name }))]}
          />

          {(formMode === 'add' || formMode === 'edit') && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Topik / Isu Utama</label>
                <input
                  autoComplete="off"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="Misal: Hipertensi tidak terkontrol"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hasil / Catatan (Opsional)</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  rows={2}
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  placeholder="Catatan dari edukasi kader"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tindak Lanjut (Opsional)</label>
                <input
                  autoComplete="off"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={formData.follow_up}
                  onChange={(e) => setFormData({ ...formData, follow_up: e.target.value })}
                  placeholder="Misal: Kunjungan ulang 1 minggu lagi"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Visit Berikutnya (Opsional)</label>
                <input
                  autoComplete="off"
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={formData.next_visit_at}
                  onChange={(e) => setFormData({ ...formData, next_visit_at: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteRecord)}
        onClose={() => setDeleteRecord(null)}
        title="Konfirmasi Hapus"
        description="Apakah Anda yakin ingin menghapus intervensi ini? Data yang sudah dihapus tidak dapat dikembalikan."
        footer={(
          <>
            <button type="button" onClick={() => setDeleteRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Batal
            </button>
            <button type="button" onClick={handleDelete} disabled={formLoading} className="rounded-xl border border-transparent bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700">
              {formLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </>
        )}
      />
    </div>
  )
}

