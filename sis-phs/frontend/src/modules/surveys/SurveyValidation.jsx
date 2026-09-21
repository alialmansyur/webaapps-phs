import { useMemo, useState, useEffect, useCallback } from 'react'
import { CheckCheck, CircleAlert, Download, Eye, FileSearch2, RefreshCcw, XCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { getSurveyValidationOptions, getSurveyValidationStatusMeta } from '../../services/adminData'
import { apiRequest } from '../../services/api'

const defaultFilters = {
  districtId: '',
  villageId: '',
  puskesmasName: '',
  status: '',
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function SurveyValidation() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [decisionState, setDecisionState] = useState(null)
  
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })
  const [decisionNotes, setDecisionNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const options = getSurveyValidationOptions()

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const qs = new URLSearchParams({
        page: page.toString(),
        search: search || '',
        districtId: filters.districtId || '',
        villageId: filters.villageId || '',
        status: filters.status || ''
      }).toString();
      const response = await apiRequest(`/puskesmas/surveys/verification?${qs}`);
      if (response.data) {
        setData(response.data || []);
        setMeta(response.meta || { page: 1, totalPages: 1 });
      }
    } catch (error) {
      console.error("Failed to fetch surveys:", error);
    } finally {
      setIsFetching(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    if (!isLoading) {
      fetchData();
    }
  }, [fetchData, isLoading]);

  const villageOptions = useMemo(() => (
    filters.districtId
      ? options.villages.filter((village) => village.districtId === filters.districtId)
      : options.villages
  ), [filters.districtId, options.villages])

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'districtId') {
        next.villageId = ''
        next.puskesmasName = ''
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

  const handleDecision = (type, record) => {
    setDecisionState({ type, record })
    setDecisionNotes('')
  }

  const submitDecision = async () => {
    if (!decisionState?.record) return;
    setIsSubmitting(true);
    try {
      await apiRequest(`/puskesmas/surveys/verification/${decisionState.record.id}/decision`, {
        method: 'POST',
        body: {
          action: decisionState.type,
          notes: decisionNotes
        }
      });
      setDecisionState(null);
      toast.success('Keputusan berhasil disimpan!');
      fetchData();
    } catch (error) {
      console.error("Failed to submit decision:", error);
      toast.error(error?.message || "Terjadi kesalahan saat memproses data.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Validasi Data Survei"
        description="Antrian review data survei."
        icon={<FileSearch2 size={22} />}
        tableColumnCount={8}
        filterFieldCount={4}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-teal-100 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-2xl">
              <FileSearch2 size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Validasi Data Survei</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Antrian review data survei.</p>
            </div>
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
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors"
          >
            <Download size={16} />
            Export Review
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-[1.5rem] border border-blue-100 dark:border-blue-800 text-sm">
        <strong>Informasi Indikator Data Sehat (IKS):</strong>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><strong>IKS 1 (Persentase):</strong> Dihitung berdasarkan persentase jawaban 'Ya' terhadap total pertanyaan yang dijawab (Makin mendekati 100% makin sehat).</li>
          <li><strong>IKS 2 (Status):</strong> Status 'SEHAT' diberikan hanya jika <strong>seluruh</strong> pertanyaan dijawab 'Ya'. Jika ada minimal 1 jawaban 'Tidak', maka status menjadi 'TIDAK SEHAT'.</li>
        </ul>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari ID survei, kader, Nama Responden, responden..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={(
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}
            </div>
          )}
        >
          <select
            value={filters.status}
            onChange={(event) => handleFilterChange('status', event.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:text-white"
          >
            <option value="">Semua Status</option>
            {options.statuses.map((statusOption) => (
              <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
            ))}
          </select>
        </FilterBar>

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Saring antrian validasi berdasarkan wilayah dan status review."
          columns={4}
        >
          <label className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Kecamatan</span>
            <select
              value={filters.districtId}
              onChange={(event) => handleFilterChange('districtId', event.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">Semua Kecamatan</option>
              {options.districts.map((district) => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Desa</span>
            <select
              value={filters.villageId}
              onChange={(event) => handleFilterChange('villageId', event.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">Semua Desa</option>
              {villageOptions.map((village) => (
                <option key={village.id} value={village.id}>{village.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Status Validasi</span>
            <select
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">Semua Status</option>
              {options.statuses.map((statusOption) => (
                <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
              ))}
            </select>
          </label>
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Tanggal Masuk', 'Survei', 'Wilayah', 'Responden', 'IKS 1 (%)', 'IKS 2 (Status)', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Tidak ada data validasi yang cocok dengan filter saat ini."
            isLoading={isFetching}
          >
            {data.map((record) => {
              const statusMeta = getSurveyValidationStatusMeta(record.status)

              return (
                <tr key={record.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(record.submittedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{record.id}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{record.kaderName} · {record.puskesmasName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>{record.districtName}</div>
                    <div className="text-slate-500 dark:text-slate-400">{record.villageName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800 dark:text-white">{record.householdHead}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{record.respondentName} · {record.respondentAge} tahun</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-bold ${
                      record.iksScore1 < 50 ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
                    }`}>
                      {record.iksScore1}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-bold ${
                      record.iksScore2 === 'TIDAK SEHAT' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
                    }`}>
                      {record.iksScore2}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${statusMeta.tone}`}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TableActionButton icon={<Eye size={16} />} label="Detail Survei" onClick={() => setSelectedRecord(record)} />
                      <TableActionButton icon={<CheckCheck size={16} />} label="Terima Survei" onClick={() => handleDecision('approve', record)} tone="success" />
                      <TableActionButton icon={<RefreshCcw size={16} />} label="Minta Revisi" onClick={() => handleDecision('revision', record)} tone="warning" />
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
        title={selectedRecord ? `Detail Survei ${selectedRecord.id}` : 'Detail Survei'}
        description="Preview detail survey untuk kebutuhan pemeriksaan cepat sebelum approval atau revisi."
        footer={(
          <>
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Tutup
            </button>
            {selectedRecord ? (
              <button
                type="button"
                onClick={() => {
                  handleDecision('approve', selectedRecord)
                  setSelectedRecord(null)
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                Setujui Data
              </button>
            ) : null}
          </>
        )}
      >
        {selectedRecord ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBlock label="Kader" value={selectedRecord.kaderName} />
              <InfoBlock label="Puskesmas" value={selectedRecord.puskesmasName} />
              <InfoBlock label="Nama Responden" value={selectedRecord.householdHead} />
              <InfoBlock label="ID responden" value={selectedRecord.householdNo} />
              <InfoBlock label="Responden" value={`${selectedRecord.respondentName} (${selectedRecord.respondentAge} tahun)`} />
              <InfoBlock label="Wilayah" value={`${selectedRecord.districtName} / ${selectedRecord.villageName}`} />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/40">
              <div className="flex flex-col gap-3 mb-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-white">IKS 1 (Persentase)</h4>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{selectedRecord.iksScore1}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-white">IKS 2 (Status)</h4>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{selectedRecord.iksScore2}</span>
                </div>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mt-4 mb-2">Indikator Risiko Ditemukan</h4>
              <div className="flex flex-wrap gap-2">
                {selectedRecord.flaggedIndicators?.length > 0 ? selectedRecord.flaggedIndicators.map((indicator, index) => (
                  <span key={index} className="inline-flex rounded-xl px-3 py-2 text-sm font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {indicator}
                  </span>
                )) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">Tidak ada indikator risiko yang ditandai.</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3">Pertanyaan</th>
                    <th className="px-5 py-3 w-32">Jawaban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-800">
                  {selectedRecord.answers?.length > 0 ? (
                    selectedRecord.answers.map((ans, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                          {ans.question_text}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg text-xs font-bold ${
                            ans.answer_text === 'Y' 
                              ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' 
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                          }`}>
                            {ans.answer_text}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-5 py-6 text-center text-slate-500 dark:text-slate-400">
                        Tidak ada detail jawaban.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/40">
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">Catatan Sebelumnya</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">{selectedRecord.notes || 'Tidak ada catatan.'}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(decisionState)}
        onClose={() => setDecisionState(null)}
        title={decisionState?.type === 'approve' ? 'Konfirmasi Persetujuan' : 'Kirim Permintaan Revisi'}
        description={decisionState?.type === 'approve'
          ? 'Gunakan aksi ini saat data survei sudah layak disahkan dan dapat masuk laporan agregat.'
          : 'Gunakan aksi ini saat admin perlu meminta perbaikan data, lampiran, atau klarifikasi dari kader.'}
        size="sm"
        footer={(
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setDecisionState(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={submitDecision}
              className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 ${
                decisionState?.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {isSubmitting ? 'Memproses...' : (decisionState?.type === 'approve' ? 'Ya, Setujui' : 'Kirim Revisi')}
            </button>
          </>
        )}
      >
        {decisionState?.record ? (
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Survei <span className="font-semibold text-slate-800 dark:text-white">{decisionState.record.id}</span> untuk keluarga <span className="font-semibold text-slate-800 dark:text-white">{decisionState.record.householdHead}</span> akan diproses.
            </p>
            
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-200 block">
                Catatan (Opsional)
              </label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Tambahkan catatan mengapa disetujui atau apa yang perlu direvisi..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[100px]"
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
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

