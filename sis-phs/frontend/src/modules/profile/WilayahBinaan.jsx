import { useEffect, useState } from 'react'
import { Download, Eye, MapPinned, RefreshCcw, Plus, Edit2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { exportRowsToExcel } from '../../utils/exportExcel'
import { getHealthStatusMeta } from '../../services/operationalData'
import { fetchWilayahBinaan, createWilayahBinaan, updateWilayahBinaan, deleteWilayahBinaan } from '../../services/profile'
import { getAuthSession } from '../../services/auth'
import { fetchKaderOperationalOptions } from '../../services/kaderLookupsApi'
import { InfoBlock, SelectField } from '../reports/reportComponents'

const defaultFilters = {
  districtId: '',
  villageId: '',
  search: '',
}

const wilayahSchema = z.object({
  village_id: z.string().min(1, 'Desa wajib dipilih'),
  rt: z.string().min(1, 'RT wajib diisi').max(10, 'Maksimal 10 karakter'),
  rw: z.string().min(1, 'RW wajib diisi').max(10, 'Maksimal 10 karakter'),
  notes: z.string().optional(),
})

async function fetchAllWilayahRows(filters) {
  const rows = []
  let currentPage = 1
  let totalPages = 1

  while (currentPage <= totalPages) {
    const response = await fetchWilayahBinaan({
      ...filters,
      page: currentPage,
      per_page: 100,
    })

    rows.push(...(response.data || []))
    totalPages = response.meta?.totalPages || 1
    currentPage += 1
  }

  return rows
}

export default function WilayahBinaan() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add') // 'add' or 'edit'
  const [recordToDelete, setRecordToDelete] = useState(null)
  
  const session = getAuthSession()
  const kaderVillageId = session?.user?.scope?.village_id || ''
  const kaderVillageName = session?.user?.scope?.village_name || 'Desa Binaan'

  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [isFetching, setIsFetching] = useState(false)
  const [options, setOptions] = useState({ districts: [], villages: [] })
  const [formOptions, setFormOptions] = useState({ districts: [], villages: [] })
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const [filterOptions, modalOptions] = await Promise.all([
          fetchKaderOperationalOptions({ districtId: filters.districtId }),
          fetchKaderOperationalOptions(),
        ])
        setOptions(filterOptions)
        setFormOptions(modalOptions)
      } catch (error) {
        toast.error('Gagal memuat opsi wilayah.')
      } finally {
        setIsLoadingOptions(false)
      }
    }

    loadOptions()
  }, [filters.districtId])

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(wilayahSchema)
  })

  const loadData = async () => {
    setIsFetching(true)
    try {
      const res = await fetchWilayahBinaan({
        page,
        per_page: 5,
        search: filters.search,
        districtId: filters.districtId,
        villageId: filters.villageId,
      })
      setData(res.data)
      setMeta(res.meta)
    } catch (error) {
      toast.error('Gagal memuat data wilayah binaan')
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, filters])

  const activeFilterCount = (filters.districtId ? 1 : 0) + (filters.villageId ? 1 : 0) + (filters.search ? 1 : 0)

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
    setFilters(defaultFilters)
    setPage(1)
  }

  const handleExport = async () => {
    try {
      const exportRows = await fetchAllWilayahRows(filters)
      exportRowsToExcel({
        filename: 'wilayah-binaan-kader',
        sheetName: 'Wilayah Binaan',
        columns: ['Wilayah', 'Desa', 'Total Survei', 'Sudah Disurvei', 'Coverage %', 'IKS Rata-rata', 'Prioritas Keluarga', 'Status'],
        rows: exportRows.map((row) => [
          `RT ${row.rt} / RW ${row.rw}`,
          row.villageName,
          row.totalHouseholds,
          row.surveyedHouseholds,
          row.coveragePct,
          parseFloat(row.avgIks).toFixed(2),
          row.priorityCount,
          getHealthStatusMeta(row.healthStatus).label,
        ]),
      })
    } catch (err) {
      toast.error('Gagal export data')
    }
  }

  const openAddModal = () => {
    setFormMode('add')
    reset({ village_id: kaderVillageId, rt: '', rw: '', notes: '' })
    setIsFormOpen(true)
  }

  const openEditModal = (record) => {
    setFormMode('edit')
    setSelectedRecord(record)
    reset({
      village_id: record.villageId || kaderVillageId,
      rt: record.rt,
      rw: record.rw,
      notes: record.notes || '',
    })
    setIsFormOpen(true)
  }

  const onSubmit = async (formData) => {
    try {
      if (formMode === 'add') {
        await createWilayahBinaan(formData)
        toast.success('Wilayah binaan berhasil ditambahkan')
      } else {
        await updateWilayahBinaan(selectedRecord.id, formData)
        toast.success('Wilayah binaan berhasil diperbarui')
      }
      setIsFormOpen(false)
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan wilayah binaan')
    }
  }

  const handleDelete = async () => {
    if (!recordToDelete) return
    try {
      await deleteWilayahBinaan(recordToDelete.id)
      toast.success('Wilayah binaan berhasil dihapus')
      setRecordToDelete(null)
      loadData()
    } catch (error) {
      toast.error('Gagal menghapus wilayah binaan')
    }
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Wilayah Binaan"
        description="Lihat coverage dan prioritas wilayah."
        icon={<MapPinned size={22} />}
        tableColumnCount={7}
        filterFieldCount={3}
        statCount={0}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <MapPinned size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Wilayah Binaan</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lihat coverage dan prioritas wilayah.</p>
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
          <button type="button" onClick={handleExport} className="master-secondary-btn px-4 py-3 text-sm font-semibold border border-slate-200 rounded-2xl dark:border-slate-700 dark:text-slate-200">
            <Download size={16} className="inline mr-2" />
            Export Wilayah
          </button>
          <button type="button" onClick={openAddModal} className="master-primary-btn px-4 py-3 text-sm font-semibold">
            <Plus size={16} />
            Tambah Wilayah
          </button>
        </div>
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari RT/RW atau catatan wilayah..."
          onSearch={(value) => handleFilterChange('search', value)}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        />

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Pisahkan area yang sudah sehat atau masih butuh perhatian coverage untuk membantu kader menyusun prioritas lapangan."
          columns={2}
        >
          <SelectField label="Kecamatan" value={filters.districtId} onChange={(value) => handleFilterChange('districtId', value)} options={[{ value: '', label: 'Semua Kecamatan' }, ...options.districts.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Desa" value={filters.villageId} onChange={(value) => handleFilterChange('villageId', value)} options={[{ value: '', label: 'Semua Desa' }, ...options.villages.map((item) => ({ value: item.id, label: item.name }))]} />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Wilayah', 'Desa', 'Coverage', 'IKS', 'Prioritas', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Belum ada area binaan yang sesuai dengan filter aktif."
            isLoading={isFetching || isLoadingOptions}
          >
            {data.map((record) => {
              const healthMeta = getHealthStatusMeta(record.healthStatus)

              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{`RT ${record.rt} / RW ${record.rw}`}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{record.totalHouseholds} KK terpetakan</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>{record.villageName}</div>
                    <div className="text-slate-500 dark:text-slate-400">{record.districtName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.coveragePct}%</div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div className={`h-full rounded-full ${record.coveragePct >= 80 ? 'bg-emerald-500' : record.coveragePct >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${record.coveragePct}%` }} />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{parseFloat(record.avgIks).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.priorityCount} keluarga</td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${healthMeta.tone}`}>{healthMeta.label}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Detail" onClick={() => {
                        setSelectedRecord(record)
                        setFormMode('detail')
                      }} />
                      <TableActionButton icon={<Edit2 size={16} />} label="Edit" onClick={() => openEditModal(record)} />
                      <TableActionButton icon={<Trash2 size={16} className="text-rose-500" />} label="Hapus" onClick={() => setRecordToDelete(record)} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={Boolean(selectedRecord) && formMode === 'detail'}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Detail Area RT ${selectedRecord.rt} / RW ${selectedRecord.rw}` : 'Detail Area'}
        description="Ringkasan coverage, kualitas wilayah, dan catatan kerja lapangan untuk area binaan tertentu."
        footer={(
          <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Tutup
          </button>
        )}
      >
        {selectedRecord && formMode === 'detail' ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBlock label="Wilayah" value={`RT ${selectedRecord.rt} / RW ${selectedRecord.rw}`} />
              <InfoBlock label="Desa" value={selectedRecord.villageName} />
              <InfoBlock label="Total Survei" value={`${selectedRecord.totalHouseholds} keluarga`} />
              <InfoBlock label="Sudah Disurvei" value={`${selectedRecord.surveyedHouseholds} keluarga`} />
              <InfoBlock label="Coverage" value={`${selectedRecord.coveragePct}%`} tone={selectedRecord.coveragePct >= 80 ? 'success' : selectedRecord.coveragePct >= 60 ? 'warning' : 'danger'} />
              <InfoBlock label="IKS Rata-rata" value={parseFloat(selectedRecord.avgIks).toFixed(2)} tone={selectedRecord.avgIks >= 0.7 ? 'success' : selectedRecord.avgIks >= 0.5 ? 'warning' : 'danger'} />
            </div>
            {selectedRecord.notes && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {selectedRecord.notes}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Form Add/Edit Modal */}
      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'add' ? 'Tambah Wilayah Binaan' : 'Edit Wilayah Binaan'}
        description={formMode === 'add' ? 'Tambahkan area baru yang menjadi tanggung jawab Anda.' : 'Ubah data area binaan.'}
      >
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Desa</label>
            <input type="hidden" {...register('village_id')} />
            <input
              autoComplete="off"
              type="text"
              readOnly
              value={kaderVillageName}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
            />
            {errors.village_id && <p className="mt-1 text-xs text-rose-500">{errors.village_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RT</label>
              <input
                autoComplete="off"
                {...register('rt')}
                type="text"
                placeholder="Contoh: 01"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
              {errors.rt && <p className="mt-1 text-xs text-rose-500">{errors.rt.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RW</label>
              <input
                autoComplete="off"
                {...register('rw')}
                type="text"
                placeholder="Contoh: 05"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
              {errors.rw && <p className="mt-1 text-xs text-rose-500">{errors.rw.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catatan Tambahan (Opsional)</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Tambahkan catatan khusus untuk wilayah ini..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="master-primary-btn px-4 py-2.5 text-sm font-medium"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Wilayah'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(recordToDelete)}
        onClose={() => setRecordToDelete(null)}
        title="Hapus Wilayah Binaan?"
        description="Wilayah binaan yang dihapus tidak dapat dikembalikan. Data survei yang sudah diinput tidak akan hilang."
        footer={(
          <>
            <button
              type="button"
              onClick={() => setRecordToDelete(null)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-600"
            >
              Ya, Hapus
            </button>
          </>
        )}
      />
    </div>
  )
}


