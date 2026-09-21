import { useEffect, useState, useCallback } from 'react'
import { ClipboardList, Download, Eye, FileUp, PencilLine, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { apiRequest } from '../../services/api'
import { getMasterQuestionsOptions } from '../../services/adminData'
import { toast } from 'react-toastify'

const defaultFilters = {
  inputType: '',
  status: '',
}

export default function MasterQuestions() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, perPage: 5, total: 0, totalPages: 1 })
  
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState(null)

  const [formData, setFormData] = useState({
    id: null,
    code: '',
    indicator: '',
    question_text: '',
    input_type: '',
    min_age: 0,
    max_age: '',
    is_active: true,
    options: []
  })

  const options = getMasterQuestionsOptions()
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page,
        perPage: 5,
        ...(search && { search }),
        ...(filters.inputType && { inputType: filters.inputType }),
        ...(filters.status && { status: filters.status }),
      })
      const response = await apiRequest(`/admin/master/questions?${queryParams.toString()}`)
      setData(response.data)
      setMeta({
        page: response.current_page,
        perPage: response.per_page,
        total: response.total,
        totalPages: response.last_page,
      })
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const handleReset = () => {
    setSearch('')
    setFilters(defaultFilters)
    setPage(1)
  }

  const handleAddClick = () => {
    setFormData({
      id: null,
      code: '',
      indicator: '',
      question_text: '',
      input_type: '',
      min_age: 0,
      max_age: '',
      is_active: true,
      options: []
    })
    setShowFormModal(true)
  }

  const handleEditClick = async (record) => {
    try {
      const res = await apiRequest(`/admin/master/questions/${record.id}`)
      setFormData({
        id: res.id,
        code: res.code,
        indicator: res.indicator || '',
        question_text: res.question_text,
        input_type: res.input_type,
        min_age: res.min_age || 0,
        max_age: res.max_age || '',
        is_active: res.is_active,
        options: res.options || []
      })
      setShowFormModal(true)
    } catch(err) {
      console.error(err)
    }
  }

  const handleDetailClick = async (record) => {
    try {
      const res = await apiRequest(`/admin/master/questions/${record.id}`)
      setSelectedQuestion(res)
    } catch(err) {
      console.error(err)
    }
  }

  const handleDeleteClick = (record) => {
    setQuestionToDelete(record)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setIsSubmitting(true)
    try {
      await apiRequest(`/admin/master/questions/${questionToDelete.id}`, { method: 'DELETE' })
      setShowDeleteModal(false)
      fetchData()
    } catch(err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = { ...formData }
      if (payload.max_age === '') payload.max_age = null
      
      if (formData.id) {
        await apiRequest(`/admin/master/questions/${formData.id}`, {
          method: 'PUT',
          body: payload
        })
      } else {
        await apiRequest(`/admin/master/questions`, {
          method: 'POST',
          body: payload
        })
      }
      setShowFormModal(false)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { label: '', value: '' }]
    }))
  }

  const updateOption = (index, field, value) => {
    const newOptions = [...formData.options]
    newOptions[index][field] = value
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const removeOption = (index) => {
    const newOptions = [...formData.options]
    newOptions.splice(index, 1)
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  if (isLoading && data.length === 0) {
    return (
      <AdminDataPageSkeleton
        title="Kuesioner Survei"
        description="Master pertanyaan, opsi jawaban, dan aktivasi berdasarkan periode tahunan."
        icon={<ClipboardList size={22} />}
        filterFieldCount={2}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Kuesioner Survei</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Master pertanyaan, opsi jawaban, dan aktivasi berdasarkan periode tahunan.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              handleReset()
              fetchData()
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
            Import Soal
          </button>
          <button
            type="button"
            onClick={handleAddClick}
            className="master-primary-btn px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Tambah Soal
          </button>
        </div>
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari kode soal, indikator, pertanyaan..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        >
          <select
            value={filters.inputType}
            onChange={(event) => handleFilterChange('inputType', event.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 dark:text-white"
          >
            <option value="">Semua Tipe</option>
            {options.inputTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={14} className="inline mr-2" />
            Export Soal
          </button>
        </FilterBar>

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Saring soal berdasarkan tipe input dan status."
          columns={2}
        >
          <SelectField
            label="Tipe Input"
            value={filters.inputType}
            onChange={(value) => handleFilterChange('inputType', value)}
            options={[{ value: '', label: 'Semua Tipe' }, ...options.inputTypes]}
          />
          <SelectField
            label="Status"
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={[{ value: '', label: 'Semua Status' }, ...options.statuses]}
          />
        </FilterPanel>

        <div className="p-6 relative">
          <DataTable
            headers={['Kode', 'Indikator', 'Pertanyaan', 'Tipe', 'Umur', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Tidak ada soal yang cocok dengan filter saat ini."
            isLoading={isLoading}
          >
            {data.map((record) => (
              <tr key={record.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-slate-800 dark:text-white">{record.code}</td>
                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{record.indicator || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="max-w-md break-words">{record.question_text}</div>
                  {record.options_count !== undefined && (
                    <div className="text-xs text-slate-500 mt-1">{record.options_count} opsi jawaban</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.input_type}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {record.min_age || 0} - {record.max_age || '∞'} thn
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${record.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                    {record.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <TableActionButton icon={<Eye size={16} />} label="Detail" onClick={() => handleDetailClick(record)} />
                    <TableActionButton icon={<PencilLine size={16} />} label="Edit" onClick={() => handleEditClick(record)} tone="primary" />
                    <TableActionButton icon={<Trash2 size={16} />} label="Hapus" onClick={() => handleDeleteClick(record)} tone="danger" />
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>

      <Modal
        open={Boolean(selectedQuestion)}
        onClose={() => setSelectedQuestion(null)}
        title={selectedQuestion ? `Detail Soal ${selectedQuestion.code}` : 'Detail Soal'}
        description="Ringkasan indikator dan aturan umur."
        footer={(
          <button
            type="button"
            onClick={() => setSelectedQuestion(null)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Tutup
          </button>
        )}
      >
        {selectedQuestion ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBlock label="Kode" value={selectedQuestion.code} />
              <InfoBlock label="Indikator" value={selectedQuestion.indicator || '-'} />
              <InfoBlock label="Tipe Input" value={selectedQuestion.input_type} />
              <InfoBlock label="Rentang Umur" value={`${selectedQuestion.min_age || 0} - ${selectedQuestion.max_age || '∞'} tahun`} />
              <InfoBlock label="Status" value={selectedQuestion.is_active ? 'Aktif' : 'Nonaktif'} />
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/40">
              <p className="text-sm text-slate-600 dark:text-slate-300">{selectedQuestion.question_text}</p>
            </div>
            {selectedQuestion.options && selectedQuestion.options.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Opsi Jawaban</h4>
                <ul className="space-y-1">
                  {selectedQuestion.options.map((opt, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                      {opt.label} <span className="text-xs text-slate-400">({opt.value})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={formData.id ? "Edit Soal" : "Tambah Soal"}
        description="Lengkapi detail pertanyaan dan opsi jawaban (bila ada)."
        size="lg"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={isSubmitting}
              className="master-primary-btn px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="Kode Soal" 
            placeholder="Misal: PHS-01" 
            value={formData.code} 
            onChange={e => setFormData({...formData, code: e.target.value})} 
          />
          <InputField 
            label="Indikator" 
            placeholder="Misal: Keluarga Berencana" 
            value={formData.indicator} 
            onChange={e => setFormData({...formData, indicator: e.target.value})} 
          />
          <div className="md:col-span-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Teks Pertanyaan</span>
              <textarea
                rows={3}
                placeholder="Tulis pertanyaan di sini..."
                value={formData.question_text}
                onChange={e => setFormData({...formData, question_text: e.target.value})}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </label>
          </div>
          <SelectField
            label="Tipe Input"
            value={formData.input_type}
            onChange={(value) => setFormData({...formData, input_type: value})}
            options={[{ value: '', label: 'Pilih Tipe Input' }, ...options.inputTypes]}
          />
          <SelectField
            label="Status"
            value={formData.is_active ? 'active' : 'inactive'}
            onChange={(value) => setFormData({...formData, is_active: value === 'active'})}
            options={options.statuses}
          />
          <InputField 
            label="Min Age (Tahun)" 
            type="number"
            placeholder="0" 
            value={formData.min_age} 
            onChange={e => setFormData({...formData, min_age: e.target.value})} 
          />
          <InputField 
            label="Max Age (Tahun)" 
            type="number"
            placeholder="Kosongkan jika tidak ada batas" 
            value={formData.max_age} 
            onChange={e => setFormData({...formData, max_age: e.target.value})} 
          />

          {(formData.input_type === 'RADIO' || formData.input_type === 'CHECKBOX') && (
            <div className="md:col-span-2 mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Opsi Jawaban</span>
                <button type="button" onClick={addOption} className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">
                  + Tambah Opsi
                </button>
              </div>
              <div className="space-y-3">
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      autoComplete="off"
                      type="text"
                      placeholder="Label (Misal: Ya)"
                      value={opt.label}
                      onChange={e => updateOption(idx, 'label', e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    <input
                      autoComplete="off"
                      type="text"
                      placeholder="Value (Misal: Y)"
                      value={opt.value}
                      onChange={e => updateOption(idx, 'value', e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    <button type="button" onClick={() => removeOption(idx)} className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {formData.options.length === 0 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 italic">Belum ada opsi jawaban.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
        description="Data kuesioner ini akan dihapus permanen. Apakah Anda yakin?"
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
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-colors"
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </>
        )}
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <p>Soal <strong>{questionToDelete?.code}</strong> akan dihapus secara permanen dari sistem.</p>
        </div>
      </Modal>

      <Modal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Master Soal"
        description="Upload template soal dan opsi jawaban untuk pembaruan massal."
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
            Drag & drop file template soal
          </div>
          <ul className="space-y-2">
            <li>Kolom minimum: `code`, `indicator`, `question_text`, `input_type`, `min_age`, `max_age`, `is_active`.</li>
            <li>Import opsi jawaban sebaiknya disimpan dalam sheet terpisah.</li>
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
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function InputField({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <input
        autoComplete="off"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
