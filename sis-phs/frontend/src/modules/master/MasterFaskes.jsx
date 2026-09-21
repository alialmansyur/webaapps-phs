import { useEffect, useState, useRef } from 'react'
import { Building2, Download, Eye, FileUp, PencilLine, Plus, RefreshCcw, Trash2, MapPinned } from 'lucide-react'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import {
  getFaskesTypeMeta,
  getMasterFaskesOptions,
} from '../../services/adminData'
import {
  fetchMasterFaskesRecords,
  createMasterFaskes,
  updateMasterFaskes,
  deleteMasterFaskes,
  addFaskesVillage,
  removeFaskesVillage,
  searchVillages,
  fetchFaskesKaders,
} from '../../services/faskesApi'
import { toast } from 'react-toastify'

const defaultFilters = {
  districtId: '',
  districtName: '',
  status: '',
  type: '',
  cadreStatus: '',
}

const defaultFormData = {
  code: '',
  name: '',
  type: '',
  district_id: '',
  phone: '',
  address: '',
  is_active: true,
}

export default function MasterFaskes() {
  const { isLoading: isSkeletonLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, perPage: 5, total: 0, totalPages: 1 })
  const [isDataLoading, setIsDataLoading] = useState(false)

  const [selectedFaskes, setSelectedFaskes] = useState(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [formData, setFormData] = useState(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const [mappedVillages, setMappedVillages] = useState([])
  const [selectedVillageToAdd, setSelectedVillageToAdd] = useState(null)
  const [isMappingLoading, setIsMappingLoading] = useState(false)

  const [faskesKaders, setFaskesKaders] = useState([])
  const [isKadersLoading, setIsKadersLoading] = useState(false)

  useEffect(() => {
    if (selectedFaskes && !showFormModal && !showDeleteModal && !showMappingModal) {
      loadKaders(selectedFaskes.id)
    }
  }, [selectedFaskes, showFormModal, showDeleteModal, showMappingModal])

  const loadKaders = async (faskesId) => {
    setIsKadersLoading(true)
    try {
      const res = await fetchFaskesKaders(faskesId)
      setFaskesKaders(res?.data || [])
    } catch (error) {
      console.error('Failed to load kaders:', error)
    } finally {
      setIsKadersLoading(false)
    }
  }

  const options = getMasterFaskesOptions()
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  useEffect(() => {
    loadData()
  }, [filters.cadreStatus, filters.districtId, filters.status, filters.type, page, search])

  const loadData = async () => {
    setIsDataLoading(true)
    try {
      const response = await fetchMasterFaskesRecords({
        page,
        perPage: 5,
        search,
        districtId: filters.districtId,
        status: filters.status,
        type: filters.type,
        cadreStatus: filters.cadreStatus,
      })
      setData(response.data || [])
      if (response.meta) {
        setMeta(response.meta)
      }
    } catch (error) {
      console.error('Failed to load faskes records:', error)
    } finally {
      setIsDataLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const handleReset = () => {
    setSearch('')
    setFilters(defaultFilters)
    setPage(1)
  }

  const handleOpenAddForm = () => {
    setFormData(defaultFormData)
    setFormError('')
    setShowFormModal(true)
  }

  const handleOpenEditForm = (record) => {
    setFormData({
      id: record.id,
      code: record.code || '',
      name: record.name || '',
      type: record.type || '',
      district_id: record.district_id || '',
      phone: record.phone || '',
      address: record.address || '',
      is_active: record.is_active !== undefined ? record.is_active : true,
    })
    setFormError('')
    setShowFormModal(true)
  }

  const handleOpenDelete = (record) => {
    setSelectedFaskes(record)
    setShowDeleteModal(true)
  }

  const handleSave = async () => {
    try {
      setFormError('')
      setIsSubmitting(true)
      
      const payload = { ...formData }
      // Mock lookup for district name to sync if needed, but backend can handle it or just leave null
      
      if (formData.id) {
        await updateMasterFaskes(formData.id, payload)
      } else {
        await createMasterFaskes(payload)
      }
      setShowFormModal(false)
      loadData()
    } catch (error) {
      setFormError(error.message || 'Gagal menyimpan data faskes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedFaskes) return
    try {
      setIsSubmitting(true)
      await deleteMasterFaskes(selectedFaskes.id)
      setShowDeleteModal(false)
      setSelectedFaskes(null)
      loadData()
    } catch (error) {
      console.error('Gagal menghapus data:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenMapping = async (record) => {
    setSelectedFaskes(record)
    setShowMappingModal(true)
    setSelectedVillageToAdd(null)
    await loadMappedVillages(record.id)
  }

  const loadMappedVillages = async (faskesId) => {
    setIsMappingLoading(true)
    try {
      const res = await fetchFaskesVillages(faskesId)
      setMappedVillages(res?.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setIsMappingLoading(false)
    }
  }

  const handleAddMapping = async () => {
    if (!selectedVillageToAdd || !selectedFaskes) return
    try {
      setIsSubmitting(true)
      await addFaskesVillage(selectedFaskes.id, selectedVillageToAdd.value)
      setSelectedVillageToAdd(null)
      await loadMappedVillages(selectedFaskes.id)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal menambahkan mapping desa.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveMapping = async (villageId) => {
    if (!selectedFaskes) return
    try {
      setIsSubmitting(true)
      await removeFaskesVillage(selectedFaskes.id, villageId)
      await loadMappedVillages(selectedFaskes.id)
    } catch (error) {
      toast.error('Gagal menghapus mapping desa.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSkeletonLoading) {
    return (
      <AdminDataPageSkeleton
        title="Fasilitas Kesehatan"
        description="Master Puskesmas dan fasilitas pendukung untuk monitoring operasional."
        icon={<Building2 size={22} />}
        filterFieldCount={4}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <Building2 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Fasilitas Kesehatan</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Master Puskesmas dan fasilitas pendukung untuk monitoring operasional.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              handleReset()
              triggerSkeleton()
              loadData()
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
            Import Faskes
          </button>
          <button
            type="button"
            onClick={handleOpenAddForm}
            className="master-primary-btn px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Tambah Faskes
          </button>
        </div>
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari kode, nama faskes, kecamatan, atau wilayah layanan..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        >
          <select
            value={filters.type}
            onChange={(event) => handleFilterChange('type', event.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white"
          >
            <option value="">Semua Jenis</option>
            {options.types.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button
            type="button"
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
          description="Saring fasilitas kesehatan berdasarkan wilayah, jenis, status, dan kesiapan kader."
          columns={4}
        >
          <AutocompleteDistrict
            label="Kecamatan"
            value={filters.districtId}
            initialName={filters.districtName}
            onChange={(id, name) => {
              handleFilterChange('districtId', id)
              handleFilterChange('districtName', name)
            }}
            placeholder="Ketik min 3 huruf..."
          />
          <SelectField
            label="Jenis Faskes"
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
            options={[{ value: '', label: 'Semua Jenis' }, ...options.types]}
          />
          <SelectField
            label="Status"
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={[{ value: '', label: 'Semua Status' }, ...options.statuses]}
          />
          <SelectField
            label="Ketersediaan Kader"
            value={filters.cadreStatus}
            onChange={(value) => handleFilterChange('cadreStatus', value)}
            options={[{ value: '', label: 'Semua Kondisi' }, ...options.cadreStatuses]}
          />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Kode', 'Nama Faskes', 'Jenis', 'Kecamatan', 'Cakupan', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState={isDataLoading ? "Memuat data fasilitas kesehatan..." : "Tidak ada fasilitas kesehatan yang cocok dengan filter saat ini."}
            isLoading={isDataLoading}
          >
            {data.map((record) => {
              const typeMeta = getFaskesTypeMeta(record.type)

              return (
                <tr key={record.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-slate-800 dark:text-white">{record.code}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{record.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${typeMeta.tone}`}>{typeMeta.label}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>{record.district_name || record.districtName || '-'}</div>
                    <div className="text-slate-500 dark:text-slate-400">{record.regency_name || record.regencyName || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {record.villages_count || 0} Desa Acuan
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {record.cadre_count || record.cadreCount || 0} Kader · {record.household_coverage || record.householdCoverage || 0} KK
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${(record.is_active ?? record.isActive) ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                      {(record.is_active ?? record.isActive) ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<MapPinned size={16} />} label="Mapping Desa" onClick={() => handleOpenMapping(record)} tone="warning" />
                      <TableActionButton icon={<Eye size={16} />} label="Detail Faskes" onClick={() => setSelectedFaskes(record)} />
                      <TableActionButton icon={<PencilLine size={16} />} label="Edit Faskes" onClick={() => handleOpenEditForm(record)} tone="primary" />
                      <TableActionButton icon={<Trash2 size={16} />} label="Hapus Faskes" onClick={() => handleOpenDelete(record)} tone="danger" />
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        </div>
      </div>

      <Modal
        open={Boolean(selectedFaskes && !showDeleteModal && !showFormModal && !showMappingModal)}
        onClose={() => setSelectedFaskes(null)}
        title={selectedFaskes ? `Detail Faskes ${selectedFaskes.name}` : 'Detail Faskes'}
        description="Ringkasan wilayah layanan, kontak, dan keterhubungan faskes terhadap modul operasional lain."
        footer={(
          <button
            type="button"
            onClick={() => setSelectedFaskes(null)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Tutup
          </button>
        )}
      >
        {selectedFaskes ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBlock label="Kode Faskes" value={selectedFaskes.code} />
              <InfoBlock label="Nama Faskes" value={selectedFaskes.name} />
              <InfoBlock label="Jenis" value={getFaskesTypeMeta(selectedFaskes.type).label} />
              <InfoBlock label="Kecamatan" value={selectedFaskes.district_name || selectedFaskes.districtName || '-'} />
              <InfoBlock label="Alamat" value={selectedFaskes.address || '-'} />
              <InfoBlock label="Nomor Kontak" value={selectedFaskes.phone || '-'} />
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Daftar Kader ({faskesKaders.length})</h3>
              {isKadersLoading ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">Memuat data kader...</div>
              ) : faskesKaders.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">Belum ada kader yang terdaftar untuk faskes ini.</div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {faskesKaders.map(kader => (
                    <div key={kader.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                      <div className="font-semibold text-sm text-slate-800 dark:text-white">{kader.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{kader.email} &bull; {kader.phone || 'No HP Tidak Tersedia'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={formData.id ? "Edit Faskes" : "Form Faskes"}
        description={formData.id ? "Perbarui informasi fasilitas kesehatan." : "Tambahkan fasilitas kesehatan baru."}
        size="lg"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="master-primary-btn px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label="Kode Faskes" 
              placeholder="PKM-3201010" 
              value={formData.code}
              onChange={(v) => setFormData(p => ({ ...p, code: v }))} 
            />
            <InputField 
              label="Nama Faskes" 
              placeholder="Nama fasilitas kesehatan" 
              value={formData.name}
              onChange={(v) => setFormData(p => ({ ...p, name: v }))} 
            />
            <SelectField
              label="Jenis Faskes"
              value={formData.type}
              onChange={(v) => setFormData(p => ({ ...p, type: v }))}
              options={[{ value: '', label: 'Pilih Jenis' }, ...options.types]}
            />
            <AutocompleteDistrict
              label="Kecamatan"
              value={formData.district_id}
              initialName={formData.district_name || ''}
              onChange={(id, name) => setFormData(p => ({ ...p, district_id: id, district_name: name }))}
            />
            <InputField 
              label="Nomor Telepon" 
              placeholder="0251-xxxxxx" 
              value={formData.phone}
              onChange={(v) => setFormData(p => ({ ...p, phone: v }))} 
            />
            <InputField 
              label="Alamat" 
              placeholder="Alamat fasilitas" 
              value={formData.address}
              onChange={(v) => setFormData(p => ({ ...p, address: v }))} 
            />
            <SelectField
              label="Status Aktif"
              value={formData.is_active ? '1' : '0'}
              onChange={(v) => setFormData(p => ({ ...p, is_active: v === '1' }))}
              options={[
                { value: '1', label: 'Aktif' },
                { value: '0', label: 'Nonaktif' }
              ]}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
        description="Data fasilitas kesehatan ini akan dihapus permanen. Apakah Anda yakin?"
        size="sm"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-colors"
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </>
        )}
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <p>Faskes <strong>{selectedFaskes?.name}</strong> ({selectedFaskes?.code}) akan dihapus secara permanen dari sistem.</p>
        </div>
      </Modal>

      <Modal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Master Faskes"
        description="Upload template fasilitas kesehatan untuk pembaruan massal."
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
              className="master-primary-btn px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Simulasikan Import
            </button>
          </>
        )}
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-5 text-center bg-slate-50 dark:bg-slate-900">
            Drag & drop file template faskes
          </div>
          <ul className="space-y-2">
            <li>Kolom minimum: `district_id`, `name`, `type`, `address`, `phone`.</li>
            <li>Backend perlu validasi bahwa setiap `district_id` punya mapping wilayah aktif sebelum import disimpan.</li>
          </ul>
        </div>
      </Modal>

      <Modal
        open={showMappingModal}
        onClose={() => {
          setShowMappingModal(false)
          setSelectedFaskes(null)
        }}
        title={`Mapping Desa: ${selectedFaskes?.name}`}
        description="Kelola wilayah desa yang berada dalam jangkauan atau naungan fasilitas kesehatan ini."
        size="lg"
        footer={(
          <button
            type="button"
            onClick={() => {
              setShowMappingModal(false)
              setSelectedFaskes(null)
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Tutup
          </button>
        )}
      >
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tambah Desa ke Cakupan Faskes</h4>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <AsyncSelectField
                  label="Pilih Desa (Ketik min 3 karakter)"
                  placeholder="Contoh: Sukamaju"
                  value={selectedVillageToAdd}
                  onChange={setSelectedVillageToAdd}
                  fetchFn={(q) => searchVillages(q, selectedFaskes?.district_id)}
                  disabled={isSubmitting || isMappingLoading}
                />
              </div>
              <button
                type="button"
                onClick={handleAddMapping}
                disabled={!selectedVillageToAdd || isSubmitting || isMappingLoading}
                className="master-primary-btn px-4 py-3 h-[46px] text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '...' : 'Tambahkan'}
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Daftar Desa dalam Cakupan</h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">ID / Kode</th>
                    <th className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Nama Desa</th>
                    <th className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isMappingLoading ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-6 text-center text-slate-500">Memuat data...</td>
                    </tr>
                  ) : mappedVillages.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-6 text-center text-slate-500">Belum ada desa yang dipetakan ke faskes ini.</td>
                    </tr>
                  ) : (
                    mappedVillages.map((village) => (
                      <tr key={village.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{village.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{village.name}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveMapping(village.id)}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
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
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange ? onChange(e.target.value) : null}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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

function AutocompleteDistrict({ label, value, initialName = '', onChange, placeholder = 'Ketik minimal 3 huruf...' }) {
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
        fetchDistricts(query)
          .then(res => {
            setOptions(res)
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
  }, [query, initialName])

  const handleSelect = (dist) => {
    onChange(dist.id, dist.name)
    setQuery(dist.name)
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
          className="w-full px-4 py-3 pr-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
          {options.map((dist) => (
            <li 
              key={dist.id} 
              className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur
                handleSelect(dist);
              }}
            >
              {dist.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AsyncSelectField({ label, placeholder, value, onChange, fetchFn, disabled }) {
  const [query, setQuery] = useState('')
  const [localOptions, setLocalOptions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLocalLoading, setIsLocalLoading] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen || query.length < 3) {
      setLocalOptions([])
      return
    }
    const timer = setTimeout(async () => {
      setIsLocalLoading(true)
      try {
        const res = await fetchFn(query)
        setLocalOptions(res?.data?.map(item => ({ value: item.id, label: item.name })) || [])
      } catch (err) {
        setLocalOptions([])
      } finally {
        setIsLocalLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query, isOpen, fetchFn])

  return (
    <div className="space-y-2 text-sm relative" ref={wrapperRef}>
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <div 
        className={`w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus-within:ring-2 focus-within:ring-emerald-500/50 flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {value && !isOpen ? (
          <div className="flex-1 truncate" onClick={() => { setIsOpen(true); setQuery(''); }}>{value.label}</div>
        ) : (
          <input
            autoComplete="off"
            type="text"
            className="w-full bg-transparent outline-none disabled:cursor-not-allowed"
            placeholder={value ? value.label : placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            disabled={disabled}
          />
        )}
        {value && (
          <button type="button" className="ml-2 text-slate-400 hover:text-slate-600" onClick={(e) => { e.stopPropagation(); onChange(null); setQuery(''); setIsOpen(false); }}>
            &times;
          </button>
        )}
      </div>
      
      {isOpen && !disabled && (query.length >= 3 || isLocalLoading) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
          {isLocalLoading ? (
            <div className="p-3 text-center text-slate-500">Mencari...</div>
          ) : localOptions.length > 0 ? (
            localOptions.map((opt) => (
              <div 
                key={opt.value} 
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200"
                onClick={() => {
                  onChange(opt)
                  setIsOpen(false)
                  setQuery('')
                }}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-slate-500">Tidak ada hasil</div>
          )}
        </div>
      )}
      {isOpen && !disabled && query.length > 0 && query.length < 3 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
          <div className="p-3 text-center text-slate-500">Ketik minimal 3 karakter...</div>
        </div>
      )}
    </div>
  )
}
