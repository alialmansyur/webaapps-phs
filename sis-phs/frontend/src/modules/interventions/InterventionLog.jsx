import { useEffect, useState } from 'react'
import { BookOpenText, Eye, RefreshCcw } from 'lucide-react'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { fetchInterventionLog } from '../../services/api/interventionsApi'
import { fetchKaderOperationalOptions } from '../../services/kaderLookupsApi'
import {
  getInterventionStatusMeta,
} from '../../services/operationalData'
import { InfoBlock, SelectField, ToneBadge } from '../reports/reportComponents'
import { toast } from 'react-toastify'

const defaultFilters = {
  districtId: '',
  villageId: '',
  status: '',
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

export default function InterventionLog() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, perPage: 5, total: 0, totalPages: 0, from: 0, to: 0 })
  const [options, setOptions] = useState({ districts: [], villages: [], interventionStatuses: [] })
  const [isFetching, setIsFetching] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const nextOptions = await fetchKaderOperationalOptions({ districtId: filters.districtId })
        setOptions(nextOptions)
      } catch (error) {
        toast.error('Gagal memuat opsi filter wilayah.')
      } finally {
        setIsLoadingOptions(false)
      }
    }

    loadOptions()
  }, [filters.districtId])

  useEffect(() => {
    const loadData = async () => {
      setIsFetching(true)
      try {
        const response = await fetchInterventionLog({
          page,
          perPage: 5,
          search,
          ...filters,
        })
        setData(response.data || [])
        setMeta({
          page: response.current_page,
          perPage: response.per_page,
          total: response.total,
          totalPages: response.last_page,
          from: response.from || 0,
          to: response.to || 0,
        })
      } catch (error) {
        toast.error('Gagal memuat log edukasi.')
      } finally {
        setIsFetching(false)
      }
    }

    loadData()
  }, [filters, page, search])

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

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Log Edukasi"
        description="Lihat riwayat edukasi dan follow-up."
        icon={<BookOpenText size={22} />}
        tableColumnCount={6}
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
            <BookOpenText size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Log Edukasi</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lihat riwayat edukasi per keluarga.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            handleReset()
            triggerSkeleton()
          }}
          className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <RefreshCcw size={16} />
          Refresh Filter
        </button>
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari responden, topik edukasi, hasil, atau tindak lanjut..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        />

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Gunakan filter untuk meninjau outcome log edukasi per desa, melihat keluarga yang masih butuh follow-up, atau mengecek beban kerja kader."
          columns={3}
        >
          <SelectField label="Kecamatan" value={filters.districtId} onChange={(value) => handleFilterChange('districtId', value)} options={[{ value: '', label: 'Semua Kecamatan' }, ...options.districts.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Desa" value={filters.villageId} onChange={(value) => handleFilterChange('villageId', value)} options={[{ value: '', label: 'Semua Desa' }, ...options.villages.map((item) => ({ value: item.id, label: item.name }))]} />
          <SelectField label="Status" value={filters.status} onChange={(value) => handleFilterChange('status', value)} options={[{ value: '', label: 'Semua Status' }, ...options.interventionStatuses]} />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Tanggal', 'Sasaran', 'Topik Edukasi', 'Hasil', 'Follow-up', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Belum ada log edukasi yang sesuai dengan filter aktif."
            isLoading={isFetching || isLoadingOptions}
          >
            {data.map((record) => {
              const statusMeta = getInterventionStatusMeta(record.status)

              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateTime(record.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.householdHead}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{record.villageName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-white">{record.topic}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.result}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 dark:text-slate-300">{record.followUp}</div>
                    <div className="mt-2"><span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${statusMeta.tone}`}>{statusMeta.label}</span></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Detail Log" onClick={() => setSelectedRecord(record)} />
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
        title={selectedRecord ? `Detail Log ${selectedRecord.householdHead}` : 'Detail Log'}
        description="Ringkasan topik, hasil, dan tindak lanjut edukasi untuk memastikan histori keluarga terbaca dengan utuh."
        footer={(
          <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Tutup
          </button>
        )}
      >
        {selectedRecord ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBlock label="Sasaran" value={selectedRecord.householdHead} />
              <InfoBlock label="Wilayah" value={`${selectedRecord.villageName}, ${selectedRecord.districtName}`} />
              <InfoBlock label="Dicatat Oleh" value={selectedRecord.recordedBy} />
              <InfoBlock label="Tanggal" value={formatDateTime(selectedRecord.createdAt)} />
              <InfoBlock label="Jadwal Berikutnya" value={selectedRecord.nextVisitAt ? formatDateTime(selectedRecord.nextVisitAt) : '-'} />
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Topik Edukasi</div>
              <div className="mt-2 text-sm font-medium text-slate-800 dark:text-white">{selectedRecord.topic}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Hasil Kunjungan</div>
              <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedRecord.result}</div>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Tindak Lanjut</div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="text-sm text-slate-600 dark:text-slate-300">{selectedRecord.followUp}</div>
                <ToneBadge tone={selectedRecord.status === 'DONE' ? 'success' : selectedRecord.status === 'SCHEDULED' ? 'info' : selectedRecord.status === 'OVERDUE' ? 'danger' : 'warning'}>
                  {getInterventionStatusMeta(selectedRecord.status).label}
                </ToneBadge>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}


