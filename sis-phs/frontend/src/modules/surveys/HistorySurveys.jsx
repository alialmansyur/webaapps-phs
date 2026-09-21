import { useEffect, useState } from 'react'
import { ClipboardCheck, Download, Eye, RefreshCcw } from 'lucide-react'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { exportRowsToExcel } from '../../utils/exportExcel'
import { apiRequest } from '../../services/api'
import { toast } from 'react-toastify'
import { fetchKaderOperationalOptions } from '../../services/kaderLookupsApi'
import {
  getHealthStatusMeta,
  getHistoryStatusMeta,
} from '../../services/operationalData'
import { InfoBlock, SelectField, ToneBadge } from '../reports/reportComponents'

const defaultFilters = {
  districtId: '',
  villageId: '',
  validationStatus: '',
  healthStatus: '',
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

async function fetchAllHistoryRows(search, filters) {
  const rows = []
  let currentPage = 1
  let totalPages = 1

  while (currentPage <= totalPages) {
    const queryParams = new URLSearchParams({
      page: currentPage,
      perPage: 100,
      search: search || '',
      districtId: filters.districtId || '',
      villageId: filters.villageId || '',
      validationStatus: filters.validationStatus || '',
      healthStatus: filters.healthStatus || '',
    }).toString()

    const response = await apiRequest(`/kader/surveys/history?${queryParams}`)
    rows.push(...(response.data || []))

    totalPages = response.meta?.totalPages || 1
    currentPage += 1
  }

  return rows
}

export default function HistorySurveys() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, perPage: 5, total: 0, totalPages: 0, from: 0, to: 0 })
  const [isFetching, setIsFetching] = useState(false)
  const [options, setOptions] = useState({ districts: [], villages: [], validationStatuses: [] })
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const nextOptions = await fetchKaderOperationalOptions({ districtId: filters.districtId })
        setOptions(nextOptions)
      } catch (error) {
        toast.error('Gagal memuat opsi wilayah.')
      } finally {
        setIsLoadingOptions(false)
      }
    }

    loadOptions()
  }, [filters.districtId])
  
  const fetchHistory = async (currentPage, currentSearch, currentFilters) => {
    setIsFetching(true)
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        perPage: 5,
        search: currentSearch || '',
        districtId: currentFilters.districtId || '',
        villageId: currentFilters.villageId || '',
        validationStatus: currentFilters.validationStatus || '',
        healthStatus: currentFilters.healthStatus || ''
      }).toString()
      
      const res = await apiRequest(`/kader/surveys/history?${queryParams}`)
      setData(res.data || [])
      if (res.meta) {
        setMeta(res.meta)
      }
    } catch (error) {
      toast.error('Gagal mengambil riwayat survei: ' + error.message)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchHistory(page, search, filters)
  }, [page, search, filters])

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const openDetail = async (record) => {
    setSelectedRecord(record)
    setIsDetailLoading(true)

    try {
      const response = await apiRequest(`/kader/surveys/history/${record.id}`)
      if (response?.data) {
        setSelectedRecord(response.data)
      }
    } catch (error) {
      toast.error('Gagal memuat detail riwayat survei.')
    } finally {
      setIsDetailLoading(false)
    }
  }

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

  const handleExport = async () => {
    try {
      const rows = await fetchAllHistoryRows(search, filters)
      
      exportRowsToExcel({
        filename: 'riwayat-survei-kader',
        sheetName: 'Riwayat Survei',
        columns: ['NIK', 'Nama Responden', 'Nama Responden', 'Tanggal Submit', 'IKS Persentase', 'Status Kesehatan', 'Status Validasi', 'Status Intervensi'],
        rows: rows.map((row) => [
          row.respondentNik,
          row.respondentName,
          row.householdHead,
          formatDateTime(row.submittedAt),
          `${(row.iksScore * 100).toFixed(0)}%`,
          getHealthStatusMeta(row.healthStatus).label,
          getHistoryStatusMeta(row.validationStatus).label,
          row.interventionStatus,
        ]),
      })
    } catch (error) {
      toast.error('Gagal mengekspor data: ' + error.message)
    }
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Riwayat Survei Saya"
        description="Lihat hasil kiriman dan status validasi."
        icon={<ClipboardCheck size={22} />}
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
            <ClipboardCheck size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Riwayat Survei Saya</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lihat hasil kiriman dan tindak lanjutnya.</p>
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
            Export Riwayat
          </button>
        </div>
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari ID survei, ID responden, Nama Responden, atau responden..."
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
          description="Pisahkan kiriman yang masih menunggu validasi, perlu revisi, atau sudah berubah menjadi sasaran intervensi."
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
            label="Status Validasi"
            value={filters.validationStatus}
            onChange={(value) => handleFilterChange('validationStatus', value)}
            options={[{ value: '', label: 'Semua Status Validasi' }, ...options.validationStatuses]}
          />
          <SelectField
            label="Status Kesehatan"
            value={filters.healthStatus}
            onChange={(value) => handleFilterChange('healthStatus', value)}
            options={[
              { value: '', label: 'Semua Status Kesehatan' },
              { value: 'SEHAT', label: 'Sehat' },
              { value: 'TIDAK_SEHAT', label: 'Tidak Sehat' },
            ]}
          />
        </FilterPanel>

        <div className="p-6">
          <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-200">
            <strong>Penjelasan Indikator IKS:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>Versi Persentase:</strong> Dihitung dari total indikator bernilai 'Ya' dibagi dengan total kuesioner yang dijawab.</li>
              <li><strong>Versi Status Kesehatan:</strong> Jika semua indikator dijawab 'Ya', maka masuk kategori <strong>Sehat</strong>. Jika terdapat minimal satu indikator yang dijawab 'Tidak', maka otomatis masuk kategori <strong>Tidak Sehat</strong>.</li>
            </ul>
          </div>
          <DataTable
            headers={['Tanggal Submit', 'NIK', 'Nama Responden', 'IKS & Status', 'Status', 'Intervensi', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Belum ada riwayat survei yang cocok dengan filter aktif."
            isLoading={isFetching || isLoadingOptions}
          >
            {data.map((record) => {
              const validationMeta = getHistoryStatusMeta(record.validationStatus)
              const healthMeta = getHealthStatusMeta(record.healthStatus)

              return (
                <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateTime(record.submittedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.respondentNik}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.respondentName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 dark:text-white">{Number(record.iksScore * 100).toFixed(0)}%</div>
                    <div className="mt-2"><ToneBadge tone={record.healthStatus === 'SEHAT' ? 'success' : 'danger'}>{healthMeta.label}</ToneBadge></div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${validationMeta.tone}`}>{validationMeta.label}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.interventionStatus}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Lihat Detail" onClick={() => openDetail(record)} />
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
        title={selectedRecord ? `Detail ${selectedRecord.id}` : 'Detail Riwayat'}
        description="Ringkasan hasil survei, status validasi, dan catatan feedback untuk mempercepat tindak lanjut kader."
        footer={(
          <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Tutup
          </button>
        )}
      >
        {selectedRecord ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBlock label="NIK" value={selectedRecord.respondentNik} />
              <InfoBlock label="Nama Responden" value={selectedRecord.respondentName} />
              <InfoBlock label="Tanggal Submit" value={formatDateTime(selectedRecord.submittedAt)} />
              <InfoBlock label="IKS (Persentase)" value={`${(selectedRecord.iksScore * 100).toFixed(0)}%`} tone={selectedRecord.iksScore >= 0.7 ? 'success' : selectedRecord.iksScore >= 0.5 ? 'warning' : 'danger'} />
              <InfoBlock label="Status Intervensi" value={selectedRecord.interventionStatus} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Status Validasi</div>
                <div className="mt-2"><ToneBadge tone={selectedRecord.validationStatus === 'APPROVED' ? 'success' : selectedRecord.validationStatus === 'REVISION' ? 'warning' : selectedRecord.validationStatus === 'REJECTED' ? 'danger' : 'info'}>{getHistoryStatusMeta(selectedRecord.validationStatus).label}</ToneBadge></div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Status Kesehatan</div>
                <div className="mt-2"><ToneBadge tone={selectedRecord.healthStatus === 'SEHAT' ? 'success' : 'danger'}>{getHealthStatusMeta(selectedRecord.healthStatus).label}</ToneBadge></div>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {selectedRecord.revisionNote || 'Belum ada catatan revisi. Jika status masih menunggu validasi, artinya data sedang berada di antrean reviewer.'}
            </div>
            
            {isDetailLoading ? (
              <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Memuat detail jawaban survei...
              </div>
            ) : null}

            {!isDetailLoading && selectedRecord.answers && selectedRecord.answers.length > 0 && (
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Detail Jawaban Kuesioner</div>
                <div className="space-y-3">
                  {selectedRecord.answers.map((ans, idx) => (
                    <div key={idx} className="flex justify-between gap-4 text-sm">
                      <div className="text-slate-600 dark:text-slate-300 leading-relaxed">{ans.question_text}</div>
                      <div className="font-semibold text-slate-800 dark:text-white shrink-0">{ans.answer_text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isDetailLoading && (!selectedRecord.answers || selectedRecord.answers.length === 0) ? (
              <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Tidak ada detail jawaban yang bisa ditampilkan.
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

