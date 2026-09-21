import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Eye, FileUp, MapPinned, PencilLine, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { exportRowsToExcel } from '../../utils/exportExcel'
import {
  createRegion,
  deleteRegion,
  fetchRegionDetail,
  fetchRegionRecords,
  importRegionsFile,
  updateRegion,
} from '../../services/liveAdminApi'
import { toast } from 'react-toastify'
import { getCurrentRole } from '../../services/auth'

const defaultFilters = {
  level: '',
  status: '',
  parentId: '',
  parentName: '',
  nodeType: '',
}

const emptyForm = {
  id: '',
  code: '',
  name: '',
  level: '',
  parentId: '',
  parentName: '',
  isActive: true,
}

const levelMeta = {
  PROVINSI: { label: 'Provinsi', tone: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' },
  KABUPATEN: { label: 'Kabupaten', tone: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300' },
  KECAMATAN: { label: 'Kecamatan', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  DESA: { label: 'Desa', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
}

function getRegionLevelMeta(level) {
  return levelMeta[level] || levelMeta.DESA
}

export default function MasterRegions() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const importInputRef = useRef(null)
  const [records, setRecords] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [formMode, setFormMode] = useState('')
  const [formDraft, setFormDraft] = useState(emptyForm)
  const [showImportModal, setShowImportModal] = useState(false)
  const [meta, setMeta] = useState({ page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
  const [options, setOptions] = useState({ levels: [], statuses: [], parents: [], nodeTypes: [] })
  const [importFileName, setImportFileName] = useState('')
  const [importProgress, setImportProgress] = useState(0)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [regionToDelete, setRegionToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isAdmin = getCurrentRole() === 'admin'

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)
  const showFormModal = formMode !== ''

  const loadRegions = async ({
    currentPage = page,
    currentSearch = search,
    currentFilters = filters,
  } = {}) => {
    setIsDataLoading(true)
    try {
      const response = await fetchRegionRecords({
        page: currentPage,
        per_page: 5,
        search: currentSearch,
        level: currentFilters.level,
        status: currentFilters.status,
        parent_id: currentFilters.parentId,
        node_type: currentFilters.nodeType,
      })

      setRecords(response?.data || [])
      setMeta(response?.meta || { page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
      setOptions(response?.filters || { levels: [], statuses: [], parents: [], nodeTypes: [] })
    } finally {
      setIsDataLoading(false)
    }
  }

  useEffect(() => {
    let alive = true
    setIsDataLoading(true)

    fetchRegionRecords({
      page,
      per_page: 5,
      search,
      level: filters.level,
      status: filters.status,
      parent_id: filters.parentId,
      node_type: filters.nodeType,
    }).then((response) => {
      if (!alive) return
      setRecords(response?.data || [])
      setMeta(response?.meta || { page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
      setOptions(response?.filters || { levels: [], statuses: [], parents: [], nodeTypes: [] })
    }).catch(() => {})
      .finally(() => {
        if (alive) setIsDataLoading(false)
      })

    return () => {
      alive = false
    }
  }, [filters.level, filters.nodeType, filters.parentId, filters.status, page, search])

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'level') {
        next.parentId = ''
        next.parentName = ''
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

  const openCreateModal = () => {
    setFormMode('create')
    setFormDraft(emptyForm)
  }

  const openEditModal = (record) => {
    setFormMode('edit')
    setFormDraft({
      id: record.id,
      code: record.code,
      name: record.name,
      level: record.level,
      parentId: record.parentId || '',
      parentName: record.parentName || '',
      isActive: record.isActive,
    })
  }

  const closeFormModal = () => {
    setFormMode('')
    setFormDraft(emptyForm)
  }

  const handleOpenDetail = async (record) => {
    try {
      const response = await fetchRegionDetail(record.level, record.id)
      setSelectedRegion(response?.data || record)
    } catch (error) {
      toast.error(error?.message || 'Gagal memuat detail wilayah.')
    }
  }

  const handleOpenDelete = (record) => {
    setRegionToDelete(record)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!regionToDelete) return
    setIsSubmitting(true)

    try {
      await deleteRegion(regionToDelete.level, regionToDelete.id)
      setShowDeleteModal(false)
      setRegionToDelete(null)
      await loadRegions({ currentPage: page })
    } catch (error) {
      toast.error(error?.message || 'Gagal menghapus wilayah.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveForm = async () => {
    if (!formDraft.code || !formDraft.name || !formDraft.level) {
      toast.warning('Kode, nama, dan level wilayah wajib diisi.')
      return
    }

    const payload = {
      code: formDraft.code,
      name: formDraft.name,
      level: formDraft.level,
      parent_id: formDraft.parentId || null,
      is_active: formDraft.isActive,
    }

    try {
      if (formMode === 'edit') {
        await updateRegion(formDraft.level, formDraft.id, payload)
      } else {
        await createRegion(payload)
      }

      await loadRegions({ currentPage: 1 })
      setPage(1)
      closeFormModal()
    } catch (error) {
      toast.error(error?.message || 'Gagal menyimpan wilayah.')
    }
  }

  const handleExport = async () => {
    try {
      const firstPage = await fetchRegionRecords({
        page: 1,
        per_page: 1000,
        search,
        level: filters.level,
        status: filters.status,
        parent_id: filters.parentId,
        node_type: filters.nodeType,
      })

      const allRows = [...(firstPage?.data || [])]
      const totalPages = firstPage?.meta?.totalPages || 1

      for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
        const response = await fetchRegionRecords({
          page: currentPage,
          per_page: 1000,
          search,
          level: filters.level,
          status: filters.status,
          parent_id: filters.parentId,
          node_type: filters.nodeType,
        })

        allRows.push(...(response?.data || []))
      }

      exportRowsToExcel({
        filename: 'master-wilayah-administrasi',
        sheetName: 'Master Wilayah',
        columns: ['Kode', 'Level', 'Nama Wilayah', 'Induk', 'Child Node', 'Cakupan Puskesmas', 'Status'],
        rows: allRows.map((item) => ([
          item.code,
          getRegionLevelMeta(item.level).label,
          item.name,
          item.parentName,
          item.childCount,
          item.puskesmasCoverage,
          item.isActive ? 'Aktif' : 'Nonaktif',
        ])),
      })
    } catch (error) {
      toast.error(error?.message || 'Gagal mengekspor master wilayah.')
    }
  }

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportFileName(file.name)
    setImportProgress(0)

    try {
      const response = await importRegionsFile(file, {
        onProgress: (progress) => setImportProgress(progress),
      })

      await loadRegions({ currentPage: 1 })
      setPage(1)
      setShowImportModal(false)
      setImportFileName('')
      setImportProgress(0)
      if (importInputRef.current) {
        importInputRef.current.value = ''
      }

      const summary = response?.data
      toast.success(
        summary
          ? `Import selesai. ${summary.created} data baru, ${summary.updated} data diperbarui dari total ${summary.total} baris.`
          : 'Import wilayah selesai diproses.',
      )
    } catch (error) {
      toast.error(error?.message || 'Gagal mengimpor wilayah.')
    }
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Wilayah Administrasi"
        description="Master wilayah untuk provinsi, kabupaten, kecamatan, dan desa"
        icon={<MapPinned size={22} />}
        filterFieldCount={4}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <MapPinned size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Wilayah Administrasi</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Master wilayah untuk provinsi, kabupaten, kecamatan, dan desa</p>
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
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <FileUp size={16} />
                Import Wilayah
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="master-primary-btn px-4 py-3 text-sm font-semibold transition-colors"
              >
                <Plus size={16} />
                Tambah Wilayah
              </button>
            </>
          )}
        </div>
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari kode, nama wilayah, atau induk wilayah..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        >
          <select
            value={filters.level}
            onChange={(event) => handleFilterChange('level', event.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:text-white"
          >
            <option value="">Semua Level</option>
            {(options.levels || []).map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={14} className="inline mr-2" />
            Export Master
          </button>
        </FilterBar>

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Saring wilayah berdasarkan level, status, induk wilayah, dan struktur node."
          columns={4}
        >
          <SelectField
            label="Level Wilayah"
            value={filters.level}
            onChange={(value) => handleFilterChange('level', value)}
            options={[{ value: '', label: 'Semua Level' }, ...(options.levels || [])]}
          />
          <SelectField
            label="Status"
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={[{ value: '', label: 'Semua Status' }, ...(options.statuses || [])]}
          />
          <AutocompleteRegion
            label="Induk Wilayah"
            value={filters.parentId}
            initialName={filters.parentName}
            parentLevel={filters.level === 'KABUPATEN' ? 'PROVINSI' : filters.level === 'KECAMATAN' ? 'KABUPATEN' : filters.level === 'DESA' ? 'KECAMATAN' : ''}
            onChange={(id, name) => {
              handleFilterChange('parentId', id)
              handleFilterChange('parentName', name)
            }}
            placeholder="Ketik min 3 huruf..."
          />
          <SelectField
            label="Struktur Node"
            value={filters.nodeType}
            onChange={(value) => handleFilterChange('nodeType', value)}
            options={[{ value: '', label: 'Semua Struktur' }, ...(options.nodeTypes || [])]}
          />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Kode', 'Level', 'Nama Wilayah', 'Induk', 'Cakupan', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Tidak ada wilayah yang cocok dengan filter saat ini."
            isLoading={isDataLoading}
          >
            {records.map((record) => {
              const metaLevel = getRegionLevelMeta(record.level)

              return (
                <tr key={`${record.level}-${record.id}`} className="align-top hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-slate-800 dark:text-white">{record.code}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${metaLevel.tone}`}>{metaLevel.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">ID: {record.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.parentName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>{record.childCount} child node</div>
                    <div className="text-slate-500 dark:text-slate-400">{record.puskesmasCoverage} puskesmas</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${record.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                      {record.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Detail Wilayah" onClick={() => handleOpenDetail(record)} />
                      {isAdmin && (
                        <>
                          <TableActionButton icon={<PencilLine size={16} />} label="Kelola Wilayah" onClick={() => openEditModal(record)} tone="primary" />
                          <TableActionButton icon={<Trash2 size={16} />} label="Hapus Wilayah" onClick={() => handleOpenDelete(record)} tone="danger" />
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
        open={Boolean(selectedRegion)}
        onClose={() => setSelectedRegion(null)}
        title={selectedRegion ? `Detail Wilayah ${selectedRegion.name}` : 'Detail Wilayah'}
        description="Preview struktur induk, cakupan child node, dan penggunaan wilayah dalam modul lain."
        footer={(
          <button
            type="button"
            onClick={() => setSelectedRegion(null)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Tutup
          </button>
        )}
      >
        {selectedRegion ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBlock label="Kode" value={selectedRegion.code} />
              <InfoBlock label="Level" value={getRegionLevelMeta(selectedRegion.level).label} />
              <InfoBlock label="Nama Wilayah" value={selectedRegion.name} />
              <InfoBlock label="Induk Wilayah" value={selectedRegion.parentName} />
              <InfoBlock label="Child Node" value={String(selectedRegion.childCount)} />
              <InfoBlock label="Cakupan Puskesmas" value={`${selectedRegion.puskesmasCoverage} unit`} />
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/40">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Wilayah ini saat ini dipakai oleh <span className="font-semibold">{selectedRegion.userCoverage || 0} user</span> dan memiliki <span className="font-semibold">{selectedRegion.householdCoverage || 0} rumah tangga</span> yang terhubung pada data operasional.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showFormModal}
        onClose={closeFormModal}
        title={formMode === 'edit' ? 'Form Wilayah' : 'Form Wilayah'}
        description="Kelola data wilayah administratif tanpa mengubah pola tampilan halaman."
        size="lg"
        footer={(
          <>
            <button
              type="button"
              onClick={closeFormModal}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveForm}
              className="master-primary-btn px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Simpan
            </button>
          </>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Kode Wilayah"
            placeholder="32.01.010.001"
            value={formDraft.code}
            onChange={(value) => setFormDraft((current) => ({ ...current, code: value }))}
          />
          <InputField
            label="Nama Wilayah"
            placeholder="Nama wilayah"
            value={formDraft.name}
            onChange={(value) => setFormDraft((current) => ({ ...current, name: value }))}
          />
          <SelectField
            label="Level Wilayah"
            value={formDraft.level}
            onChange={(value) => setFormDraft((current) => ({ ...current, level: value, parentId: '', parentName: '' }))}
            options={[{ value: '', label: 'Pilih Level' }, ...(options.levels || [])]}
          />
          <AutocompleteRegion
            label="Induk Wilayah"
            value={formDraft.parentId}
            initialName={formDraft.parentName || ''}
            parentLevel={formDraft.level === 'KABUPATEN' ? 'PROVINSI' : formDraft.level === 'KECAMATAN' ? 'KABUPATEN' : formDraft.level === 'DESA' ? 'KECAMATAN' : ''}
            onChange={(id, name) => setFormDraft((current) => ({ ...current, parentId: id, parentName: name }))}
            placeholder={formDraft.level === 'PROVINSI' ? 'Tidak perlu Induk' : 'Ketik min 3 huruf...'}
          />
        </div>
      </Modal>

      <Modal
        open={showImportModal}
        onClose={() => {
          setShowImportModal(false)
          setImportFileName('')
          setImportProgress(0)
          if (importInputRef.current) {
            importInputRef.current.value = ''
          }
        }}
        title="Import Master Wilayah"
        description="Upload template referensi wilayah untuk pembaruan massal."
        size="sm"
        footer={(
          <>
            <button
              type="button"
              onClick={() => {
                setShowImportModal(false)
                setImportFileName('')
                setImportProgress(0)
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="master-primary-btn px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Pilih File CSV
            </button>
          </>
        )}
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFileChange}
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="w-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-5 text-center bg-slate-50 dark:bg-slate-900"
          >
            {importFileName || 'Pilih file template wilayah'}
          </button>
          {importProgress > 0 ? (
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-sky-500 transition-all" style={{ width: `${importProgress}%` }} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Upload {importProgress}%</div>
            </div>
          ) : null}
          <ul className="space-y-2">
            <li>Kolom minimum: `code`, `name`, `level`, `parent_id`.</li>
            <li>Kolom opsional: `status` atau `is_active` dengan nilai `aktif/nonaktif` atau `true/false`.</li>
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
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
      >
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function InputField({ label, placeholder, value, onChange }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <input
        autoComplete="off"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
      />
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

function AutocompleteRegion({ label, value, initialName = '', onChange, placeholder = 'Ketik min 3 huruf...', parentLevel = '' }) {
  const [query, setQuery] = useState(initialName)
  const [options, setOptions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuery(initialName)
  }, [initialName])

  useEffect(() => {
    if (query.length >= 3 && query !== initialName) {
      setLoading(true)
      const timer = setTimeout(() => {
        fetchRegionRecords({ search: query, level: parentLevel, per_page: 50 })
          .then(res => {
            setOptions(res.data || [])
            setIsOpen(true)
            setLoading(false)
          })
          .catch(() => setLoading(false))
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setOptions([])
      setIsOpen(false)
    }
  }, [query, initialName, parentLevel])

  const handleSelect = (region) => {
    onChange(region.id, region.name)
    setQuery(region.name)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('', '')
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="relative space-y-2 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <div className="relative">
        <input
          autoComplete="off"
          type="text"
          className="w-full px-4 py-3 pr-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!e.target.value) {
               onChange('', '')
            }
          }}
          placeholder={placeholder}
          onFocus={() => { if (options.length > 0) setIsOpen(true) }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        {query && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={handleClear}
          >
            &times;
          </button>
        )}
        {loading && <div className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-slate-400">...</div>}
      </div>
      {isOpen && options.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
          {options.map((region) => (
            <li 
              key={region.id} 
              className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(region);
              }}
            >
              {region.code} - {region.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
