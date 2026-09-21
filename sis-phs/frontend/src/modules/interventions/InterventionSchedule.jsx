import { useEffect, useState, useCallback } from 'react'
import { CalendarClock, CheckSquare, Eye, RefreshCcw } from 'lucide-react'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { fetchInterventions, storeIntervention } from '../../services/api/interventionsApi'
import { InfoBlock } from '../reports/reportComponents'
import { toast } from 'react-toastify'

const defaultFilters = {}

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

export default function InterventionSchedule() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('belum')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [inputRecord, setInputRecord] = useState(null)
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [nextVisitAt, setNextVisitAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [data, setData] = useState([])
  const [meta, setMeta] = useState(null)
  const [isFetching, setIsFetching] = useState(false)

  const loadData = useCallback(async () => {
    setIsFetching(true)
    try {
      const response = await fetchInterventions({
        page,
        perPage: 10,
        search,
        tab: activeTab
      })
      setData(response.data || [])
      setMeta({
        page: response.current_page,
        perPage: response.per_page,
        total: response.total,
        totalPages: response.last_page,
        from: response.from,
        to: response.to
      })
    } catch (error) {
      toast.error('Gagal memuat jadwal intervensi.')
    } finally {
      setIsFetching(false)
    }
  }, [page, search, activeTab])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleReset = () => {
    setSearch('')
    setPage(1)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleSubmit = async () => {
    if (!topic || !result) {
      toast.error('Topik dan Hasil Kunjungan wajib diisi.')
      return
    }
    
    setIsSubmitting(true)
    try {
      await storeIntervention({
        survey_id: inputRecord.id,
        topic,
        result,
        follow_up: followUp,
        next_visit_at: nextVisitAt
      })
      toast.success('Edukasi berhasil dicatat.')
      setInputRecord(null)
      setTopic('')
      setResult('')
      setFollowUp('')
      setNextVisitAt('')
      loadData()
      setActiveTab('sudah')
    } catch (error) {
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan catatan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Jadwal Intervensi"
        description="Lihat agenda kunjungan intervensi."
        icon={<CalendarClock size={22} />}
        tableColumnCount={7}
        filterFieldCount={1}
        statCount={0}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <CalendarClock size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Jadwal Intervensi</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lihat agenda kunjungan dan follow-up.</p>
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
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          className={`pb-4 px-2 text-sm font-semibold transition-colors ${
            activeTab === 'belum' 
              ? 'border-b-2 border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          onClick={() => handleTabChange('belum')}
        >
          Belum Diintervensi
        </button>
        <button
          className={`pb-4 px-2 text-sm font-semibold transition-colors ${
            activeTab === 'sudah' 
              ? 'border-b-2 border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          onClick={() => handleTabChange('sudah')}
        >
          Sudah Diintervensi
        </button>
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari nama sasaran atau NIK..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        <div className="p-6">
          <DataTable
            headers={activeTab === 'sudah' 
              ? ['Sasaran', 'Wilayah', 'Topik', 'Waktu', 'Aksi'] 
              : ['Sasaran', 'Wilayah', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Belum ada jadwal yang sesuai."
            isLoading={isFetching}
          >
            {data.map((record) => (
              <tr key={record.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 dark:text-white">{record.respondentName}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">KK: {record.householdNo}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  <div>{record.villageName}</div>
                  <div className="text-slate-500 dark:text-slate-400">{record.districtName}</div>
                </td>
                {activeTab === 'sudah' ? (
                  <>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-white">{record.topic}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{record.result}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDateTime(record.intervenedAt)}
                    </td>
                  </>
                ) : (
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-xl px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      {record.status}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {activeTab === 'sudah' ? (
                       <TableActionButton icon={<Eye size={16} />} label="Detail" onClick={() => setSelectedRecord(record)} />
                    ) : (
                       <TableActionButton icon={<CheckSquare size={16} />} label="Catat Edukasi" onClick={() => setInputRecord(record)} tone="primary" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>

      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Detail Intervensi ${selectedRecord.respondentName}` : 'Detail'}
        description="Detail edukasi yang telah diberikan."
        footer={(
          <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Tutup
          </button>
        )}
      >
        {selectedRecord ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoBlock label="Sasaran" value={selectedRecord.respondentName} />
            <InfoBlock label="Wilayah" value={`${selectedRecord.villageName}, ${selectedRecord.districtName}`} />
            <InfoBlock label="Puskesmas" value={selectedRecord.puskesmasName} />
            <InfoBlock label="Waktu Edukasi" value={formatDateTime(selectedRecord.intervenedAt)} />
            <div className="md:col-span-2">
              <InfoBlock label="Topik Edukasi" value={selectedRecord.topic} />
            </div>
            <div className="md:col-span-2">
              <InfoBlock label="Hasil Edukasi" value={selectedRecord.result} />
            </div>
            <div className="md:col-span-2">
              <InfoBlock label="Tindak Lanjut" value={selectedRecord.followUp || '-'} />
            </div>
            <div className="md:col-span-2">
              <InfoBlock label="Jadwal Kunjungan Berikutnya" value={selectedRecord.nextVisitAt ? formatDateTime(selectedRecord.nextVisitAt) : '-'} />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(inputRecord)}
        onClose={() => setInputRecord(null)}
        title={inputRecord ? `Catat Edukasi ${inputRecord.respondentName}` : 'Catat Edukasi'}
        description="Modal ini menyiapkan form input hasil kunjungan, topik edukasi, serta rencana follow-up berikutnya."
        footer={(
          <>
            <button type="button" onClick={() => setInputRecord(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200" disabled={isSubmitting}>
              Batal
            </button>
            <button type="button" onClick={handleSubmit} className="master-primary-btn px-4 py-2.5 text-sm font-medium" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <label className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Topik Edukasi</span>
            <input 
              autoComplete="off"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white" 
              placeholder="Contoh: Edukasi berhenti merokok di rumah" 
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Hasil Kunjungan</span>
            <textarea 
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={3} 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white" 
              placeholder="Tuliskan respons responden dan keputusan tindak lanjut." 
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Tindak Lanjut (Opsional)</span>
            <input 
              autoComplete="off"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white" 
              placeholder="Contoh: Kunjungan ulang bulan depan" 
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Jadwal Kunjungan Berikutnya (Opsional)</span>
            <input 
              autoComplete="off"
              type="datetime-local"
              value={nextVisitAt}
              onChange={(e) => setNextVisitAt(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white" 
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}


